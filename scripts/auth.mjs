#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(PROJECT_ROOT, 'state');
const TOKEN_PATH = path.join(STATE_DIR, 'oauth-token.json');
const DEFAULT_CALLBACK_PORT = Number(process.env.FIGMA_OAUTH_PORT || 9876);
const FIGMA_MCP_URL = process.env.FIGMA_MCP_URL || 'https://mcp.figma.com/mcp';

function randomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256base64url(input) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 500)}`);
  }
}

async function discoverOAuthMetadata(baseUrl) {
  const pr = await fetchJson(new URL('/.well-known/oauth-protected-resource', baseUrl));
  const authServer = Array.isArray(pr.authorization_servers) && pr.authorization_servers[0]
    ? pr.authorization_servers[0]
    : null;
  if (!authServer) {
    throw new Error('No authorization_servers found in protected resource metadata');
  }
  const authMeta = await fetchJson(new URL('/.well-known/oauth-authorization-server', authServer));
  return { pr, authMeta, authServer };
}

async function registerClient(authMeta, redirectUri) {
  const payload = {
    client_name: 'OpenClaw Figma Agent',
    redirect_uris: [redirectUri],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'native'
  };

  const res = await fetch(authMeta.registration_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`DCR failed (${res.status}): ${text.slice(0, 1000)}`);
  }
  const json = JSON.parse(text);
  if (!json.client_id) throw new Error('DCR response missing client_id');
  return json;
}

function buildAuthorizeUrl(authMeta, clientId, redirectUri, codeChallenge, state) {
  const url = new URL(authMeta.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  if (Array.isArray(authMeta.scopes_supported) && authMeta.scopes_supported.length) {
    // Figma MCP uses DCR/OAuth separate from REST scopes. Avoid forcing scope unless required.
  }
  return url;
}

async function waitForCallback({ port, expectedState, timeoutMs = 300000 }) {
  return await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end('Not found');
        return;
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDesc = url.searchParams.get('error_description');
      if (error) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`OAuth error: ${error}\n${errorDesc || ''}`);
        cleanup();
        reject(new Error(`OAuth error: ${error}${errorDesc ? ` — ${errorDesc}` : ''}`));
        return;
      }
      if (!code) {
        res.writeHead(400).end('Missing code');
        return;
      }
      if (state !== expectedState) {
        res.writeHead(400).end('Invalid state');
        cleanup();
        reject(new Error('OAuth callback state mismatch'));
        return;
      }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Figma OAuth successful. You can close this window now.');
      cleanup();
      resolve({ code });
    });

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`OAuth callback timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      server.close(() => {});
    }

    server.on('error', (err) => {
      cleanup();
      reject(err);
    });

    server.listen(port, '127.0.0.1');
  });
}

async function exchangeCodeForToken(authMeta, clientId, code, redirectUri, codeVerifier) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });
  const res = await fetch(authMeta.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 1000)}`);
  }
  const json = JSON.parse(text);
  if (!json.access_token) throw new Error('Token response missing access_token');
  return json;
}

async function refreshToken(authMeta, clientId, refreshTokenValue) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshTokenValue
  });
  const res = await fetch(authMeta.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Refresh failed (${res.status}): ${text.slice(0, 1000)}`);
  }
  const json = JSON.parse(text);
  if (!json.access_token) throw new Error('Refresh response missing access_token');
  return json;
}

async function saveToken(data) {
  await fs.mkdir(STATE_DIR, { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(data, null, 2));
}

async function loadToken() {
  const raw = await fs.readFile(TOKEN_PATH, 'utf8');
  return JSON.parse(raw);
}

function tokenRecord({ token, client, meta, redirectUri }) {
  const now = new Date();
  const expiresAt = token.expires_in ? new Date(now.getTime() + token.expires_in * 1000).toISOString() : null;
  return {
    provider: 'figma-mcp',
    mcpUrl: FIGMA_MCP_URL,
    redirectUri,
    savedAt: now.toISOString(),
    expiresAt,
    client: {
      client_id: client.client_id,
      client_id_issued_at: client.client_id_issued_at ?? null
    },
    metadata: {
      authorization_endpoint: meta.authorization_endpoint,
      token_endpoint: meta.token_endpoint,
      registration_endpoint: meta.registration_endpoint
    },
    token
  };
}

function printNextSteps(record) {
  console.log('\nToken gespeichert unter:');
  console.log(`  ${TOKEN_PATH}`);
  console.log('\nNext step (T-008):');
  console.log('  OpenClaw Config patchen:');
  console.log('  mcp.servers.figma = {');
  console.log(`    "url": "${FIGMA_MCP_URL}",`);
  console.log(`    "headers": { "Authorization": "Bearer ${record.token.access_token.slice(0, 12)}..." }`);
  console.log('  }');
  if (record.expiresAt) {
    console.log(`\nToken is expected to expire at: ${record.expiresAt}`);
    console.log('Refresh later with: node scripts/auth.mjs --refresh');
  }
}

async function runAuth() {
  const port = DEFAULT_CALLBACK_PORT;
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  console.log(`Discovering OAuth metadata for ${FIGMA_MCP_URL} ...`);
  const { authMeta } = await discoverOAuthMetadata(FIGMA_MCP_URL);
  console.log('Registering dynamic OAuth client ...');
  const client = await registerClient(authMeta, redirectUri);
  const codeVerifier = randomString(48);
  const codeChallenge = sha256base64url(codeVerifier);
  const state = randomString(24);
  const authUrl = buildAuthorizeUrl(authMeta, client.client_id, redirectUri, codeChallenge, state);

  console.log('\nOpen this URL manually in your browser:');
  console.log(authUrl.toString());
  console.log(`\nWaiting for OAuth callback on ${redirectUri} ...`);

  const { code } = await waitForCallback({ port, expectedState: state });
  console.log('Code received, exchanging for token ...');
  const token = await exchangeCodeForToken(authMeta, client.client_id, code, redirectUri, codeVerifier);
  const record = tokenRecord({ token, client, meta: authMeta, redirectUri });
  await saveToken(record);
  printNextSteps(record);
}

async function runRefresh() {
  const existing = await loadToken();
  if (!existing.token?.refresh_token) {
    throw new Error('No refresh_token found. Please run auth again.');
  }
  const { authMeta } = await discoverOAuthMetadata(existing.mcpUrl || FIGMA_MCP_URL);
  const refreshed = await refreshToken(authMeta, existing.client.client_id, existing.token.refresh_token);
  const mergedToken = {
    ...existing.token,
    ...refreshed,
    refresh_token: refreshed.refresh_token || existing.token.refresh_token
  };
  const record = tokenRecord({ token: mergedToken, client: existing.client, meta: authMeta, redirectUri: existing.redirectUri });
  await saveToken(record);
  printNextSteps(record);
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  if (refresh) {
    await runRefresh();
  } else {
    await runAuth();
  }
}

main().catch((err) => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});

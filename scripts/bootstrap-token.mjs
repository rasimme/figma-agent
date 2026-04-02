#!/usr/bin/env node
/**
 * bootstrap-token.mjs — Multi-client Figma MCP token bootstrap
 *
 * Scans known MCP client credential stores for a valid Figma OAuth token,
 * then writes it into OpenClaw's openclaw.json for the figma-agent wrapper.
 *
 * Supported clients (in priority order):
 *   1. Claude Code     ~/.claude/.credentials.json
 *   2. Codex (OpenAI)  ~/.codex/auth.json
 *   3. Windsurf        ~/.codeium/windsurf/mcp_config.json
 *
 * Not yet supported (contributions welcome):
 *   - Cursor: credential storage undocumented
 *   - VS Code: tokens in SQLite (state.vscdb), requires DB extraction
 *   - Kiro, Replit, Android Studio, etc.: unknown storage
 *
 * Usage:
 *   node scripts/bootstrap-token.mjs [--dry-run] [--refresh]
 *
 * This is a TEMPORARY workaround. Once Figma opens DCR for custom clients
 * or OpenClaw becomes an approved MCP client, direct auth will replace this.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const DRY_RUN = process.argv.includes('--dry-run');
const REFRESH = process.argv.includes('--refresh');

// --- Client extractors ---

function extractClaudeCode() {
  const credPath = resolve(HOME, '.claude', '.credentials.json');
  if (!existsSync(credPath)) return null;

  try {
    const creds = JSON.parse(readFileSync(credPath, 'utf8'));
    const mcpOAuth = creds.mcpOAuth;
    if (!mcpOAuth || typeof mcpOAuth !== 'object') return null;

    // Find any entry that looks like a Figma token
    for (const [key, entry] of Object.entries(mcpOAuth)) {
      if (!entry || typeof entry !== 'object') continue;
      const serverUrl = entry.serverUrl || '';
      const serverName = entry.serverName || '';
      if (!serverUrl.includes('figma') && !serverName.includes('figma') && !key.includes('figma')) continue;
      if (!entry.accessToken) continue;

      return {
        client: 'Claude Code',
        path: credPath,
        key,
        accessToken: entry.accessToken,
        refreshToken: entry.refreshToken || null,
        expiresAt: entry.expiresAt || null,
        clientId: entry.clientId || null,
        clientSecret: entry.clientSecret || null,
      };
    }
  } catch { /* ignore parse errors */ }
  return null;
}

function extractCodex() {
  const authPath = resolve(HOME, '.codex', 'auth.json');
  if (!existsSync(authPath)) return null;

  try {
    const auth = JSON.parse(readFileSync(authPath, 'utf8'));
    // Codex stores per-server OAuth tokens; look for figma
    if (typeof auth !== 'object') return null;

    for (const [key, entry] of Object.entries(auth)) {
      if (!key.includes('figma') && !(entry?.serverUrl || '').includes('figma')) continue;
      if (!entry?.accessToken) continue;

      return {
        client: 'Codex (OpenAI)',
        path: authPath,
        key,
        accessToken: entry.accessToken,
        refreshToken: entry.refreshToken || null,
        expiresAt: entry.expiresAt || null,
        clientId: entry.clientId || null,
        clientSecret: entry.clientSecret || null,
      };
    }
  } catch { /* ignore */ }
  return null;
}

function extractWindsurf() {
  const configPath = resolve(HOME, '.codeium', 'windsurf', 'mcp_config.json');
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const servers = config.mcpServers || {};

    for (const [name, server] of Object.entries(servers)) {
      if (!name.includes('figma') && !(server?.url || server?.serverUrl || '').includes('figma')) continue;
      // Token might be in headers or env
      const authHeader = server?.headers?.Authorization || '';
      if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        return {
          client: 'Windsurf',
          path: configPath,
          key: name,
          accessToken: token,
          refreshToken: null,
          expiresAt: null,
          clientId: null,
          clientSecret: null,
        };
      }
    }
  } catch { /* ignore */ }
  return null;
}

// --- Token refresh ---

async function refreshToken(source) {
  if (!source.refreshToken || !source.clientId) {
    console.error('⚠️  No refresh token or client ID — cannot refresh.');
    return null;
  }

  // Discover token endpoint from Figma's OAuth metadata
  const metaRes = await fetch('https://mcp.figma.com/.well-known/oauth-authorization-server');
  if (!metaRes.ok) {
    console.error(`⚠️  Failed to fetch OAuth metadata: ${metaRes.status}`);
    return null;
  }
  const meta = await metaRes.json();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: source.refreshToken,
    client_id: source.clientId,
  });
  if (source.clientSecret) body.set('client_secret', source.clientSecret);

  const tokenRes = await fetch(meta.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '');
    console.error(`⚠️  Token refresh failed: ${tokenRes.status} — ${text.slice(0, 200)}`);
    return null;
  }

  const tokens = await tokenRes.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || source.refreshToken,
    expiresAt: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : null,
  };
}

// --- OpenClaw config writer ---

function writeToOpenClaw(token) {
  // Find openclaw.json
  const candidates = [
    resolve(HOME, '.openclaw', 'openclaw.json'),
    resolve(HOME, '.config', 'openclaw', 'openclaw.json'),
  ];

  let configPath = null;
  let config = null;
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        config = JSON.parse(readFileSync(p, 'utf8'));
        configPath = p;
        break;
      } catch { /* try next */ }
    }
  }

  if (!config || !configPath) {
    console.error('❌ openclaw.json not found.');
    return false;
  }

  // Ensure mcp.servers.figma exists
  if (!config.mcp) config.mcp = {};
  if (!config.mcp.servers) config.mcp.servers = {};
  if (!config.mcp.servers.figma) config.mcp.servers.figma = {};

  config.mcp.servers.figma.url = 'https://mcp.figma.com/mcp';
  config.mcp.servers.figma.headers = {
    Authorization: `Bearer ${token}`,
  };

  if (DRY_RUN) {
    console.log(`🔍 DRY RUN — would write to: ${configPath}`);
    console.log(`   mcp.servers.figma.headers.Authorization = Bearer ${token.slice(0, 8)}...`);
    return true;
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Token written to ${configPath}`);
  return true;
}

// --- Main ---

const extractors = [
  { name: 'Claude Code', fn: extractClaudeCode },
  { name: 'Codex (OpenAI)', fn: extractCodex },
  { name: 'Windsurf', fn: extractWindsurf },
];

console.log('🔎 Scanning for Figma MCP tokens...\n');

let source = null;
for (const { name, fn } of extractors) {
  const result = fn();
  if (result) {
    console.log(`✅ Found token from ${name}`);
    console.log(`   File: ${result.path}`);
    console.log(`   Key: ${result.key}`);
    if (result.expiresAt) {
      const exp = new Date(result.expiresAt);
      const isExpired = exp < new Date();
      console.log(`   Expires: ${exp.toISOString()} ${isExpired ? '⚠️ EXPIRED' : '✅'}`);
    }
    if (result.refreshToken) console.log('   Refresh token: available');
    source = result;
    break;
  } else {
    console.log(`   ⬚ ${name} — not found`);
  }
}

if (!source) {
  console.error('\n❌ No Figma MCP token found in any supported client.');
  console.error('   Please connect Figma MCP in one of:');
  console.error('     • Claude Code: claude mcp add figma');
  console.error('     • Codex: configure in ~/.codex/config.toml');
  console.error('     • Windsurf: add Figma to MCP settings');
  console.error('     • Cursor / VS Code: connect, then run this script again');
  process.exit(1);
}

// Refresh if requested or expired
let token = source.accessToken;
if (REFRESH || (source.expiresAt && new Date(source.expiresAt) < new Date())) {
  console.log('\n🔄 Refreshing token...');
  const refreshed = await refreshToken(source);
  if (refreshed) {
    token = refreshed.accessToken;
    console.log('✅ Token refreshed.');
    if (refreshed.expiresAt) {
      console.log(`   New expiry: ${new Date(refreshed.expiresAt).toISOString()}`);
    }
  } else {
    console.error('⚠️  Refresh failed — using existing token (may be expired).');
  }
}

// Write to OpenClaw
console.log('');
const ok = writeToOpenClaw(token);
if (ok && !DRY_RUN) {
  console.log('\n🎉 Done. Restart OpenClaw gateway to pick up the new token:');
  console.log('   openclaw gateway restart');
}

process.exit(ok ? 0 : 1);

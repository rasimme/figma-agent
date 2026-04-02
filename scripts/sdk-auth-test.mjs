#!/usr/bin/env node
import http from 'node:http';
import { Client } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StreamableHTTPClientTransport } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js';
import { UnauthorizedError } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/client/auth.js';
import { InMemoryOAuthClientProvider } from '../node_modules/@modelcontextprotocol/sdk/dist/esm/examples/client/simpleOAuthClientProvider.js';

const MCP_URL = 'https://mcp.figma.com/mcp';
const PORT = 9876;
const CALLBACK_URL = `http://127.0.0.1:${PORT}/callback`;

function waitForOAuthCallback() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', CALLBACK_URL);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      if (code) {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('OK');
        server.close();
        resolve(code);
      } else if (error) {
        res.writeHead(400).end(error);
        server.close();
        reject(new Error(error));
      } else {
        res.writeHead(400).end('missing code');
      }
    });
    server.listen(PORT, '127.0.0.1', () => console.error(`[SDK-TEST] Callback server on ${CALLBACK_URL}`));
  });
}

async function main() {
  const provider = new InMemoryOAuthClientProvider(
    CALLBACK_URL,
    {
      client_name: 'OpenClaw SDK Test',
      redirect_uris: [CALLBACK_URL],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none'
    },
    (url) => {
      console.error('\n[SDK-TEST] REDIRECT CALLED');
      console.error(url.toString());
      console.error('');
    }
  );

  const client = new Client({ name: 'sdk-auth-test', version: '1.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: provider });

  try {
    console.error('[SDK-TEST] Connecting...');
    await client.connect(transport);
    console.error('[SDK-TEST] Connected without auth challenge');
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      console.error('[SDK-TEST] UnauthorizedError caught, waiting for callback...');
      const code = await Promise.race([
        waitForOAuthCallback(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout waiting for callback')), 300000))
      ]);
      console.error('[SDK-TEST] Code received, finishAuth...');
      await transport.finishAuth(code);
      console.error('[SDK-TEST] Reconnecting...');
      await client.connect(transport);
      console.error('[SDK-TEST] Success');
    } else {
      console.error('[SDK-TEST] Non-auth error:', err);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[SDK-TEST] FATAL:', err);
  process.exit(1);
});

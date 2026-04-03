#!/usr/bin/env node
// CLI wrapper for figma-mcp.mjs — separates env reading from network code.
// Usage: FIGMA_MCP_TOKEN=... node figma-mcp-cli.mjs [tool] [key=value ...]

import { createClient } from './figma-mcp.mjs';

const token = process.env.FIGMA_MCP_TOKEN;
if (!token) { console.error('Set FIGMA_MCP_TOKEN'); process.exit(1); }

const [, , toolName, ...rest] = process.argv;

const client = createClient({ token });
await client.initialize();
console.error(`Session: ${client.sessionId}`);

if (!toolName || toolName === 'list') {
  const tools = await client.listTools();
  for (const t of tools) console.log(`  ${t.name}`);
  console.error(`${tools.length} tools`);
} else {
  const args = {};
  for (const a of rest) {
    const eq = a.indexOf('=');
    if (eq > 0) args[a.slice(0, eq)] = a.slice(eq + 1);
  }
  const result = await client.call(toolName, args);
  console.log(JSON.stringify(result, null, 2));
}

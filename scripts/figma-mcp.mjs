/**
 * figma-mcp.mjs — Zero-dependency Figma MCP client
 * 
 * Talks to Figma's Remote MCP server (mcp.figma.com/mcp)
 * via MCP Streamable HTTP (JSON-RPC 2.0 over HTTP POST).
 * 
 * Usage:
 *   import { createClient } from './figma-mcp.mjs';
 *   const client = createClient({ token: 'Bearer figu_...' });
 *   await client.initialize();
 *   const result = await client.call('whoami', {});
 *   const tools = await client.listTools();
 */

const DEFAULT_URL = 'https://mcp.figma.com/mcp';
const PROTOCOL_VERSION = '2025-03-26';
const CLIENT_NAME = 'figma-agent';
const CLIENT_VERSION = '1.0.0';

/**
 * Create a Figma MCP client.
 * @param {Object} opts
 * @param {string} opts.token - Bearer token or full Authorization header, e.g. "figu_xxx" or "Bearer figu_xxx"
 * @param {string} [opts.url] - MCP server URL (default: mcp.figma.com/mcp)
 * @param {number} [opts.timeoutMs] - Request timeout in ms (default: 30000)
 */
export function createClient(opts = {}) {
  const url = opts.url || DEFAULT_URL;
  const rawToken = opts.token;
  const timeoutMs = opts.timeoutMs ?? 30000;

  if (!rawToken) throw new Error('figma-mcp: token is required');
  const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;

  let _nextId = 1;

  let sessionId = null;
  let initialized = false;

  function headers() {
    const h = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': token,
    };
    if (sessionId) h['Mcp-Session-Id'] = sessionId;
    return h;
  }

  async function rpc(method, params = {}) {
    const id = _nextId++;
    const body = { jsonrpc: '2.0', id, method, params };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        if (controller.signal.aborted) {
          throw new Error(`figma-mcp: request timed out after ${timeoutMs}ms`);
        }
        throw new Error(`figma-mcp: fetch failed — ${fetchErr.message}`);
      }

      // Capture session ID from first successful response
      const sid = res.headers.get('mcp-session-id');
      if (sid) sessionId = sid;

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`figma-mcp: HTTP ${res.status} — ${text.slice(0, 200)}`);
      }

      const contentType = res.headers.get('content-type') || '';

      // SSE response — parse event stream for the result
      if (contentType.includes('text/event-stream')) {
        return await parseSse(res, id);
      }

      // Direct JSON response
      const json = await res.json();
      if (json.error) {
        throw new Error(`figma-mcp: RPC error ${json.error.code} — ${json.error.message}`);
      }
      if (json.id !== undefined && json.id !== id) {
        throw new Error(`figma-mcp: response id mismatch (expected ${id}, got ${json.id})`);
      }
      return json.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async function parseSse(res, requestId) {
    const text = await res.text();
    // Normalize line endings and split into event blocks
    const normalized = text.replace(/\r\n/g, '\n');
    const events = normalized.split('\n\n').filter(Boolean);

    for (const event of events) {
      const lines = event.split('\n');
      // Join all data: lines for this event (handles multi-line payloads)
      const dataLines = lines
        .filter(l => l.startsWith('data: ') || l.startsWith('data:'))
        .map(l => l.startsWith('data: ') ? l.slice(6) : l.slice(5));
      if (dataLines.length === 0) continue;
      const payload = dataLines.join('');

      try {
        const json = JSON.parse(payload);
        if (json.id === requestId) {
          if (json.error) {
            throw new Error(`figma-mcp: RPC error ${json.error.code} — ${json.error.message}`);
          }
          return json.result;
        }
      } catch (e) {
        if (e.message.startsWith('figma-mcp:')) throw e;
        // Skip non-JSON events (comments, notifications, etc.)
      }
    }
    throw new Error('figma-mcp: no matching response in SSE stream');
  }

  return {
    /** Initialize the MCP session. Must be called before any tool call. */
    async initialize() {
      const result = await rpc('initialize', {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: CLIENT_NAME, version: CLIENT_VERSION },
      });
      if (!result || typeof result !== 'object') {
        throw new Error('figma-mcp: initialize failed — server returned no valid result');
      }
      initialized = true;
      // MCP spec: client must send initialized notification after handshake
      await rpc('notifications/initialized', {}).catch(() => {});
      return result;
    },

    /** List available tools from the server. */
    async listTools() {
      if (!initialized) throw new Error('figma-mcp: call initialize() first');
      const result = await rpc('tools/list', {});
      return result.tools || [];
    },

    /** Call a tool by name with arguments. */
    async call(toolName, args = {}) {
      if (!initialized) throw new Error('figma-mcp: call initialize() first');
      return await rpc('tools/call', { name: toolName, arguments: args });
    },

    /** Get current session ID (null before initialize). */
    get sessionId() { return sessionId; },

    /** Whether initialize() has been called. */
    get isInitialized() { return initialized; },
  };
}

// --- CLI mode: run directly for quick testing ---
if (import.meta.url === `file://${process.argv[1]}`) {
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
    // Parse key=value args
    const args = {};
    for (const a of rest) {
      const eq = a.indexOf('=');
      if (eq > 0) args[a.slice(0, eq)] = a.slice(eq + 1);
    }
    const result = await client.call(toolName, args);
    console.log(JSON.stringify(result, null, 2));
  }
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as crypto from 'crypto';

// 1. RBAC Wildcard Matching Engine (compatible with isa-auth-core)
function matchPermissionRule(userPermission: string, requiredRule: string): boolean {
  if (userPermission === '*' || userPermission === requiredRule) return true;
  const userParts = userPermission.split(':');
  const reqParts = requiredRule.split(':');
  for (let i = 0; i < userParts.length; i++) {
    if (userParts[i] === '*') return true;
    if (i >= reqParts.length || userParts[i] !== reqParts[i]) return false;
  }
  return userParts.length === reqParts.length;
}

function resolveInheritedRoles(roles: string[], hierarchy: Record<string, string[]> = {}): string[] {
  const result = new Set<string>();
  const queue = [...roles];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!result.has(current)) {
      result.add(current);
      const inherited = hierarchy[current] || [];
      queue.push(...inherited);
    }
  }
  return Array.from(result);
}

// 2. SIWE Message Parser
function parseSiwe(message: string) {
  try {
    const lines = message.split('\n');
    const headerLine = lines[0] || '';
    const domainMatch = headerLine.match(/^(.+) wants you to sign in with your Ethereum account:/);
    const domain = domainMatch ? domainMatch[1].trim() : 'Unknown';
    const address = lines[1]?.trim() || '';

    let uri = '';
    let chainId = 1;
    let nonce = '';
    let issuedAt = '';

    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith('URI: ')) uri = l.replace('URI: ', '');
      if (l.startsWith('Chain ID: ')) chainId = parseInt(l.replace('Chain ID: ', ''), 10) || 1;
      if (l.startsWith('Nonce: ')) nonce = l.replace('Nonce: ', '');
      if (l.startsWith('Issued At: ')) issuedAt = l.replace('Issued At: ', '');
    }

    return { valid: true, domain, address, chainId, nonce, issuedAt };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

// 3. Setup MCP Server
const server = new Server(
  {
    name: 'isa-auth-mcp',
    version: '0.2.2',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Available Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'isa_check_permission',
        description:
          'Evaluates if an agent or user possesses a required permission rule using isa-auth wildcard RBAC and role hierarchy inheritance.',
        inputSchema: {
          type: 'object',
          properties: {
            userRoles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Roles currently assigned to the user/agent (e.g. ["ADMIN", "DEV"])',
            },
            userPermissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Explicit permissions granted (e.g. ["users:*", "reports:read"])',
            },
            requiredRule: {
              type: 'string',
              description: 'Required permission or role pattern to evaluate (e.g. "users:delete")',
            },
            roleHierarchy: {
              type: 'object',
              description: 'Optional role inheritance map (e.g. { "SUPERADMIN": ["ADMIN"], "ADMIN": ["USER"] })',
            },
          },
          required: ['requiredRule'],
        },
      },
      {
        name: 'isa_inspect_jwt',
        description:
          'Decodes and inspects a JWT token structure, displaying header, payload, expiration status, remaining TTL, and optional secret verification.',
        inputSchema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT token string to inspect',
            },
            secret: {
              type: 'string',
              description: 'Optional HMAC-SHA256 secret key to verify token authenticity',
            },
          },
          required: ['token'],
        },
      },
      {
        name: 'isa_verify_siwe',
        description:
          'Parses and validates an Ethereum Sign-In with Ethereum (EIP-4361 SIWE) message format and matches it against an address.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Raw SIWE message string',
            },
            expectedAddress: {
              type: 'string',
              description: 'Expected Ethereum wallet address (0x...)',
            },
          },
          required: ['message', 'expectedAddress'],
        },
      },
      {
        name: 'isa_scaffold_provider',
        description:
          'Generates frontend initialization snippets and environment variable templates for any of the 11 supported authentication providers.',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              description: 'Target provider name (e.g. "google", "kakao", "naver", "github", "web3", "passkey", "world")',
            },
            storage: {
              type: 'string',
              description: 'Storage mode (memory, cookie, dev_insecure_localStorage)',
            },
          },
          required: ['provider'],
        },
      },
    ],
  };
});

// Handle Tool Invocations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'isa_check_permission': {
      const userRoles: string[] = (args?.userRoles as any) || [];
      const userPermissions: string[] = (args?.userPermissions as any) || [];
      const requiredRule: string = (args?.requiredRule as string) || '';
      const hierarchy = (args?.roleHierarchy as any) || {
        SUPERADMIN: ['ADMIN'],
        ADMIN: ['MANAGER', 'USER'],
        MANAGER: ['USER'],
      };

      const resolvedRoles = resolveInheritedRoles(userRoles, hierarchy);

      // 1. Direct role match
      if (resolvedRoles.includes(requiredRule)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                granted: true,
                reason: `Direct role match. Role "${requiredRule}" exists in resolved roles [${resolvedRoles.join(', ')}].`,
                resolvedRoles,
              }, null, 2),
            },
          ],
        };
      }

      // 2. Wildcard permission match
      const matchingPerm = userPermissions.find((perm) => matchPermissionRule(perm, requiredRule));

      if (matchingPerm) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                granted: true,
                reason: `Permission granted via pattern "${matchingPerm}" matching required rule "${requiredRule}".`,
                matchedPattern: matchingPerm,
                resolvedRoles,
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              granted: false,
              reason: `Permission denied. Required rule "${requiredRule}" not satisfied by roles [${resolvedRoles.join(', ')}] or permissions [${userPermissions.join(', ')}].`,
              resolvedRoles,
            }, null, 2),
          },
        ],
      };
    }

    case 'isa_inspect_jwt': {
      const token = (args?.token as string) || '';
      const secret = args?.secret as string | undefined;

      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Malformed JWT. Expected 3 dot-separated segments.' }, null, 2) }],
        };
      }

      try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        const isExpired = exp ? exp < now : false;
        const ttlSeconds = exp ? exp - now : null;

        let signatureValid: boolean | null = null;
        if (secret) {
          const dataToSign = `${parts[0]}.${parts[1]}`;
          const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(dataToSign)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
          signatureValid = parts[2] === expectedSig;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                header,
                payload,
                isExpired,
                ttlSeconds,
                signatureValid,
              }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Failed to parse JWT: ${err.message}` }, null, 2) }],
        };
      }
    }

    case 'isa_verify_siwe': {
      const message = (args?.message as string) || '';
      const expectedAddress = ((args?.expectedAddress as string) || '').toLowerCase();
      const parsed = parseSiwe(message);

      if (!parsed.valid) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ valid: false, error: parsed.error }, null, 2) }],
        };
      }

      const addressMatches = parsed.address.toLowerCase() === expectedAddress;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              valid: addressMatches,
              addressMatches,
              parsed,
            }, null, 2),
          },
        ],
      };
    }

    case 'isa_scaffold_provider': {
      const provider = (args?.provider as string) || 'google';
      const storage = (args?.storage as string) || 'memory';

      const envKeys: Record<string, string> = {
        google: 'VITE_GOOGLE_CLIENT_ID',
        apple: 'VITE_APPLE_CLIENT_ID',
        kakao: 'VITE_KAKAO_CLIENT_ID',
        naver: 'VITE_NAVER_CLIENT_ID',
        github: 'VITE_GITHUB_CLIENT_ID',
        discord: 'VITE_DISCORD_CLIENT_ID',
        meta: 'VITE_META_CLIENT_ID',
        line: 'VITE_LINE_CLIENT_ID',
        web3: 'VITE_APP_DOMAIN',
        world: 'VITE_WORLD_ID_APP_ID',
        passkey: 'VITE_PASSKEY_RP_ID',
      };

      const codeSnippet = `import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({
  storage: '${storage}', // 'memory' (Zero XSS) or 'cookie'
  providers: {
    ${provider}: {
      clientId: import.meta.env.${envKeys[provider] || 'VITE_CLIENT_ID'},
      callbackUrl: window.location.origin + '/callback',
    }
  }
});

// Trigger login:
await auth.signIn('${provider}');
`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              provider,
              requiredEnv: envKeys[provider] || 'VITE_CLIENT_ID',
              codeSnippet,
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 4. Start Server on Stdio
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  console.error('[isa-auth-mcp] Fatal error:', error);
  process.exit(1);
});

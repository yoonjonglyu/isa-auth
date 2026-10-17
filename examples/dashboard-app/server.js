const http = require('http');
const fs = require('fs');
const path = require('path');
const { IsaAuthServer } = require('../../packages/server/dist/index.js');

const PORT = 4000;

// Initialize isa-auth-server backend instance
const authServer = new IsaAuthServer({
  jwt: {
    secret: process.env.JWT_SECRET || 'cloudflow-production-master-secret-key-9999',
    expiresInSeconds: 900, // 15 minutes
    issuer: 'cloudflow-saas',
    audience: 'cloudflow-client',
  },
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-secret',
      redirectUri: `http://localhost:${PORT}/callback`,
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID || 'demo-kakao-key',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || 'demo-secret',
      redirectUri: `http://localhost:${PORT}/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || 'demo-github-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-secret',
    },
  },
  worldId: {
    appId: process.env.WORLD_ID_APP_ID || 'app_demo_world_id',
  },
  onUserResolved: (user, provider, raw) => {
    // Custom user enhancement: assign realistic roles based on email or id
    if (user.email && user.email.includes('admin')) {
      user.roles = ['ADMIN', 'USER'];
      user.permissions = ['projects:*', 'admin:*', 'billing:read'];
    } else {
      user.roles = ['USER'];
      user.permissions = ['projects:read', 'projects:create'];
    }
    return user;
  },
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: Token Exchange (Powered by isa-auth-server)
  if (req.method === 'POST' && url === '/api/auth/exchange') {
    try {
      const body = await readBody(req);

      // Support special One-Click Demo Mode for instant review without external API keys
      if (body.type === 'demo_login') {
        const role = body.role || 'USER';
        const demoUser = {
          id: role === 'ADMIN' ? 'usr_admin_001' : 'usr_dev_042',
          name: role === 'ADMIN' ? 'Alex Rivera (DevOps Lead)' : 'Jordan Lee (Frontend Engineer)',
          email: role === 'ADMIN' ? 'alex.admin@cloudflow.io' : 'jordan.lee@cloudflow.io',
          avatar: role === 'ADMIN'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          roles: role === 'ADMIN' ? ['ADMIN', 'USER'] : ['USER'],
          permissions: role === 'ADMIN'
            ? ['projects:*', 'admin:*', 'billing:read', 'users:read', 'deploy:production']
            : ['projects:read', 'projects:create', 'deploy:staging'],
          provider: body.provider || 'google',
        };

        const tokenExpiresIn = 900;
        const accessToken = authServer.jwtService.sign({
          sub: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          roles: demoUser.roles,
          permissions: demoUser.permissions,
          provider: demoUser.provider,
        }, tokenExpiresIn);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          accessToken,
          expiresIn: tokenExpiresIn,
          tokenType: 'Bearer',
          user: demoUser,
        }));
        return;
      }

      // Real Token Exchange
      const result = await authServer.handleExchange(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'TOKEN_EXCHANGE_FAILED', message: err.message }));
    }
    return;
  }

  // API 2: Protected Current User Profile (JWT Authentication Guard)
  if (req.method === 'GET' && url === '/api/user/me') {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Missing Bearer token' }));
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authServer.verifyToken(token);

    if (!decoded) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'INVALID_TOKEN', message: 'JWT token has expired or is invalid.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', user: decoded }));
    return;
  }

  // API 3: Protected Admin-Only Metrics (RBAC Role Check on Server)
  if (req.method === 'GET' && url === '/api/admin/metrics') {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authServer.verifyToken(token);

    if (!decoded || !decoded.roles || !decoded.roles.includes('ADMIN')) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'FORBIDDEN',
        message: 'Access Denied: Requires "ADMIN" role.',
        yourRoles: decoded ? decoded.roles : [],
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      adminData: {
        serverCpuUsage: '14.2%',
        activeClusters: 12,
        monthlyBillingRunRate: '$18,450',
        confidentialAuditLog: [
          { time: '10:45:12', action: 'DEPLOY_K8S_POD', user: decoded.email || decoded.sub },
          { time: '09:20:00', action: 'ROTATE_API_KEYS', user: 'system' }
        ]
      }
    }));
    return;
  }

  // Static files handling
  let filePath;
  if (url.startsWith('/dist/')) {
    filePath = path.join(__dirname, '../../packages/isa-auth', url);
  } else {
    const reqUrl = (url === '/' || !path.extname(url)) ? '/index.html' : url;
    filePath = path.join(__dirname, 'public', reqUrl);
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Fallback to index.html for SPA client-side routing
      const indexPath = path.join(__dirname, 'public', 'index.html');
      fs.readFile(indexPath, (idxErr, idxContent) => {
        if (idxErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`404 Not Found: ${url}`);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(idxContent);
      });
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 CloudFlow SaaS Demo Service running at http://localhost:${PORT}`);
  console.log(`⚡ Powered by isa-auth (Client) & isa-auth-server (BFF Backend)`);
  console.log(`======================================================\n`);
});

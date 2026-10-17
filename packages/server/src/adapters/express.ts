import { IsaAuthServer } from '../server';

export function createExpressHandler(server: IsaAuthServer) {
  return async (req: any, res: any) => {
    try {
      const payload = req.body;
      const result = await server.handleExchange(payload);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        error: 'TOKEN_EXCHANGE_FAILED',
        message: error.message || 'Token exchange failed',
      });
    }
  };
}

export function createExpressAuthMiddleware(server: IsaAuthServer) {
  return (req: any, res: any, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing Bearer token' });
    }

    const token = authHeader.substring(7);
    const user = server.verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or expired' });
    }

    req.user = user;
    next();
  };
}

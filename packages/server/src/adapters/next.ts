import { IsaAuthServer } from '../server';

/**
 * Next.js Pages Router API Handler:
 * Usage:
 * // pages/api/auth/exchange.ts
 * export default createNextApiHandler(authServer);
 */
export function createNextApiHandler(server: IsaAuthServer) {
  return async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} Not Allowed` });
    }

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

/**
 * Next.js App Router Route Handler:
 * Usage:
 * // app/api/auth/exchange/route.ts
 * export const POST = createNextRouteHandler(authServer);
 */
export function createNextRouteHandler(server: IsaAuthServer) {
  return async (request: Request) => {
    try {
      const payload = await request.json();
      const result = await server.handleExchange(payload);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: 'TOKEN_EXCHANGE_FAILED',
          message: error.message || 'Token exchange failed',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

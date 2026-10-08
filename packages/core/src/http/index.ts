/**
 * HTTP Client utilities with automatic Authorization header injection and 401 retry
 */

export interface AuthClientInterface {
  getAccessToken(): string | null;
  refreshToken?(refreshFn?: () => Promise<string>): Promise<string | null>;
  clearAuthState?(): void;
}

export interface AuthFetchOptions {
  authClient: AuthClientInterface;
  refreshFn?: () => Promise<string>;
  baseUrl?: string;
  onUnauthorized?: () => void;
  headerName?: string; // Default: 'Authorization'
  tokenPrefix?: string; // Default: 'Bearer '
}

/**
 * Creates an authenticated fetch wrapper that injects Bearer token and automatically retries upon 401.
 */
export function createAuthFetch(options: AuthFetchOptions) {
  const {
    authClient,
    refreshFn,
    baseUrl = '',
    onUnauthorized,
    headerName = 'Authorization',
    tokenPrefix = 'Bearer ',
  } = options;

  let isRefreshing = false;
  let refreshQueue: Array<(token: string | null) => void> = [];

  const processQueue = (newToken: string | null) => {
    refreshQueue.forEach((callback) => callback(newToken));
    refreshQueue = [];
  };

  return async function authFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    const url = typeof input === 'string' && baseUrl && !input.startsWith('http')
      ? `${baseUrl.replace(/\/$/, '')}/${input.replace(/^\//, '')}`
      : input;

    const headers = new Headers(init.headers || {});

    // 1. Inject current token if available
    const token = authClient.getAccessToken();
    if (token && !headers.has(headerName)) {
      headers.set(headerName, `${tokenPrefix}${token}`);
    }

    const modifiedInit: RequestInit = {
      ...init,
      headers,
    };

    // 2. Execute request
    let response = await fetch(url, modifiedInit);

    // 3. Handle 401 Unauthorized
    if (response.status === 401 && authClient.refreshToken && refreshFn) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await authClient.refreshToken(refreshFn);
          isRefreshing = false;
          processQueue(newToken);

          if (newToken) {
            // Retry initial request with new token
            headers.set(headerName, `${tokenPrefix}${newToken}`);
            return await fetch(url, { ...init, headers });
          } else {
            if (onUnauthorized) onUnauthorized();
            authClient.clearAuthState?.();
          }
        } catch (err) {
          isRefreshing = false;
          processQueue(null);
          if (onUnauthorized) onUnauthorized();
          authClient.clearAuthState?.();
          throw err;
        }
      } else {
        // Wait for current refresh to complete
        return new Promise<Response>((resolve, reject) => {
          refreshQueue.push(async (newToken) => {
            if (newToken) {
              try {
                headers.set(headerName, `${tokenPrefix}${newToken}`);
                const retryRes = await fetch(url, { ...init, headers });
                resolve(retryRes);
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(response);
            }
          });
        });
      }
    }

    return response;
  };
}

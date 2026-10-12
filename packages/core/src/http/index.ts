/**
 * HTTP Client utilities with automatic Authorization header injection and 401 retry
 * Supports both Fetch API (createAuthFetch) and Axios (applyAuthInterceptor / createAuthAxios)
 */

export interface AuthClientInterface {
  getAccessToken(): string | null;
  refreshToken?(refreshFn?: () => Promise<string>): Promise<string | null>;
  clearAuthState?(): void;
}

export interface AuthHttpOptions {
  authClient: AuthClientInterface;
  refreshFn?: () => Promise<string>;
  baseUrl?: string;
  onUnauthorized?: () => void;
  headerName?: string; // Default: 'Authorization'
  tokenPrefix?: string; // Default: 'Bearer '
  withCredentials?: boolean; // For HttpOnly Cookie / Hybrid session mode
  beforeRequest?: (config: any) => any | Promise<any>;
  afterResponse?: (response: any) => any | Promise<any>;
}

export interface AuthFetchOptions extends AuthHttpOptions {
  customFetch?: typeof fetch;
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
    withCredentials = false,
    customFetch = typeof fetch !== 'undefined' ? fetch : undefined,
    beforeRequest,
    afterResponse,
  } = options;

  if (!customFetch) {
    throw new Error('[ISA-AUTH] Fetch API is not available.');
  }

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

    let headers = new Headers(init.headers || {});

    // 1. Inject current token if available
    const token = authClient.getAccessToken();
    if (token && !headers.has(headerName)) {
      headers.set(headerName, `${tokenPrefix}${token}`);
    }

    let modifiedInit: RequestInit = {
      ...init,
      headers,
    };

    if (withCredentials) {
      modifiedInit.credentials = 'include';
    }

    // Optional beforeRequest hook
    if (beforeRequest) {
      modifiedInit = (await beforeRequest(modifiedInit)) || modifiedInit;
    }

    // 2. Execute request
    let response = await customFetch(url, modifiedInit);

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
            const retryHeaders = new Headers(modifiedInit.headers);
            retryHeaders.set(headerName, `${tokenPrefix}${newToken}`);
            const retryResponse = await customFetch(url, { ...modifiedInit, headers: retryHeaders });
            return afterResponse ? (await afterResponse(retryResponse)) || retryResponse : retryResponse;
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
        // Wait for current refresh to complete in queue
        return new Promise<Response>((resolve, reject) => {
          refreshQueue.push(async (newToken) => {
            if (newToken) {
              try {
                const retryHeaders = new Headers(modifiedInit.headers);
                retryHeaders.set(headerName, `${tokenPrefix}${newToken}`);
                const retryRes = await customFetch(url, { ...modifiedInit, headers: retryHeaders });
                const finalRes = afterResponse ? (await afterResponse(retryRes)) || retryRes : retryRes;
                resolve(finalRes);
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

    if (afterResponse) {
      response = (await afterResponse(response)) || response;
    }

    return response;
  };
}

/**
 * Applies authorization interceptor and automatic 401 token refresh retry to an Axios instance.
 */
export function applyAuthInterceptor(axiosInstance: any, options: AuthHttpOptions) {
  const {
    authClient,
    refreshFn,
    onUnauthorized,
    headerName = 'Authorization',
    tokenPrefix = 'Bearer ',
    withCredentials = false,
    beforeRequest,
    afterResponse,
  } = options;

  let isRefreshing = false;
  let refreshQueue: Array<(token: string | null) => void> = [];

  const processQueue = (token: string | null) => {
    refreshQueue.forEach((callback) => callback(token));
    refreshQueue = [];
  };

  // 1. Request Interceptor: Inject Token
  const reqInterceptorId = axiosInstance.interceptors.request.use(
    async (config: any) => {
      const token = authClient.getAccessToken();
      if (token && !config.headers[headerName]) {
        config.headers[headerName] = `${tokenPrefix}${token}`;
      }

      if (withCredentials) {
        config.withCredentials = true;
      }

      if (beforeRequest) {
        config = (await beforeRequest(config)) || config;
      }

      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // 2. Response Interceptor: Catch 401 and Refresh Token
  const resInterceptorId = axiosInstance.interceptors.response.use(
    async (response: any) => {
      if (afterResponse) {
        return (await afterResponse(response)) || response;
      }
      return response;
    },
    async (error: any) => {
      const originalRequest = error.config;

      if (!originalRequest || !error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      // Avoid infinite retry loop
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      if (!authClient.refreshToken || !refreshFn) {
        if (onUnauthorized) onUnauthorized();
        authClient.clearAuthState?.();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh finishes
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest.headers[headerName] = `${tokenPrefix}${token}`;
              resolve(axiosInstance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await authClient.refreshToken(refreshFn);
        isRefreshing = false;
        processQueue(newToken);

        if (newToken) {
          originalRequest.headers[headerName] = `${tokenPrefix}${newToken}`;
          return axiosInstance(originalRequest);
        } else {
          if (onUnauthorized) onUnauthorized();
          authClient.clearAuthState?.();
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(null);
        if (onUnauthorized) onUnauthorized();
        authClient.clearAuthState?.();
        return Promise.reject(refreshErr);
      }
    }
  );

  return {
    eject: () => {
      axiosInstance.interceptors.request.eject(reqInterceptorId);
      axiosInstance.interceptors.response.eject(resInterceptorId);
    },
  };
}

/**
 * Helper to create or wrap an Axios instance with auth interceptors.
 */
export function createAuthAxios(axiosModuleOrInstance: any, options: AuthHttpOptions) {
  const instance = typeof axiosModuleOrInstance.create === 'function'
    ? axiosModuleOrInstance.create({ baseURL: options.baseUrl })
    : axiosModuleOrInstance;

  applyAuthInterceptor(instance, options);
  return instance;
}

/**
 * Token Exchange Adapter
 * Standardized interface and HTTP implementation for exchanging OAuth codes,
 * World ID proofs, Passkey assertions, and Web3 signatures with backend APIs.
 */

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user?: any;
  raw?: any;
}

export interface TokenExchangeAdapter {
  exchangeOAuthCode(
    provider: string,
    code: string,
    options?: { redirectUri?: string; state?: string; codeVerifier?: string }
  ): Promise<TokenExchangeResult>;

  exchangeWorldProof?(
    proofResult: any,
    options?: { action?: string; signal?: string }
  ): Promise<TokenExchangeResult>;

  exchangePasskeyAssertion?(
    assertion: any,
    options?: { challenge?: string }
  ): Promise<TokenExchangeResult>;

  exchangeWeb3Signature?(
    signatureResult: { address: string; signature: string; message: string; chainId: number }
  ): Promise<TokenExchangeResult>;
}

export interface HttpTokenExchangeOptions {
  tokenEndpoint: string; // e.g. '/api/auth/exchange' or 'https://api.myapp.com/auth/token'
  headers?: Record<string, string>;
  credentials?: RequestCredentials; // 'include' | 'same-origin' | 'omit'
  customBodyFormatter?: (type: string, payload: any) => any;
  fetchFn?: typeof fetch;
}

/**
 * Standard HTTP-based Token Exchange Adapter
 */
export class HttpTokenExchangeAdapter implements TokenExchangeAdapter {
  private endpoint: string;
  private headers: Record<string, string>;
  private credentials: RequestCredentials;
  private customBodyFormatter?: (type: string, payload: any) => any;
  private fetchFn: typeof fetch;

  constructor(options: HttpTokenExchangeOptions) {
    this.endpoint = options.tokenEndpoint;
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.credentials = options.credentials || 'include';
    this.customBodyFormatter = options.customBodyFormatter;
    this.fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : (null as any));
  }

  private async postExchange(type: string, payload: any): Promise<TokenExchangeResult> {
    if (!this.fetchFn) {
      throw new Error('[ISA-AUTH] Fetch is not available in the current environment.');
    }

    const body = this.customBodyFormatter
      ? this.customBodyFormatter(type, payload)
      : { type, ...payload };

    const response = await this.fetchFn(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      credentials: this.credentials,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: any;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { message: errorText };
      }
      throw new Error(
        `[ISA-AUTH] Token exchange failed (${response.status}): ${
          errorJson.message || errorJson.error || response.statusText
        }`
      );
    }

    const data = await response.json();

    return {
      accessToken: data.accessToken || data.access_token || data.token,
      refreshToken: data.refreshToken || data.refresh_token,
      expiresIn: data.expiresIn || data.expires_in,
      tokenType: data.tokenType || data.token_type || 'Bearer',
      user: data.user || data.profile,
      raw: data,
    };
  }

  async exchangeOAuthCode(
    provider: string,
    code: string,
    options: { redirectUri?: string; state?: string; codeVerifier?: string } = {}
  ): Promise<TokenExchangeResult> {
    return this.postExchange('oauth_code', {
      provider,
      code,
      redirectUri: options.redirectUri,
      state: options.state,
      codeVerifier: options.codeVerifier,
    });
  }

  async exchangeWorldProof(
    proofResult: any,
    options: { action?: string; signal?: string } = {}
  ): Promise<TokenExchangeResult> {
    return this.postExchange('world_id_proof', {
      proof: proofResult,
      action: options.action || proofResult.action,
      signal: options.signal || proofResult.signal,
    });
  }

  async exchangePasskeyAssertion(
    assertion: any,
    options: { challenge?: string } = {}
  ): Promise<TokenExchangeResult> {
    return this.postExchange('passkey_assertion', {
      assertion,
      challenge: options.challenge,
    });
  }

  async exchangeWeb3Signature(
    signatureResult: { address: string; signature: string; message: string; chainId: number }
  ): Promise<TokenExchangeResult> {
    return this.postExchange('web3_signature', signatureResult);
  }
}

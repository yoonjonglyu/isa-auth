export interface OAuthProviderServerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scope?: string[];
}

export interface JwtServerConfig {
  secret: string;
  issuer?: string;
  audience?: string;
  expiresInSeconds?: number;
}

export interface ServerAuthConfig {
  jwt: JwtServerConfig;
  providers?: {
    google?: OAuthProviderServerConfig;
    github?: OAuthProviderServerConfig;
    kakao?: OAuthProviderServerConfig;
    naver?: OAuthProviderServerConfig;
    apple?: OAuthProviderServerConfig;
    discord?: OAuthProviderServerConfig;
    line?: OAuthProviderServerConfig;
    meta?: OAuthProviderServerConfig;
    [key: string]: OAuthProviderServerConfig | undefined;
  };
  worldId?: {
    appId: string;
    action?: string;
  };
  passkey?: {
    rpId: string;
    origin: string;
  };
  onUserResolved?: (user: any, provider: string, raw: any) => Promise<any> | any;
}

export interface TokenExchangePayload {
  type: 'oauth_code' | 'world_id_proof' | 'passkey_assertion' | 'web3_signature';
  provider?: string;
  code?: string;
  redirectUri?: string;
  state?: string;
  codeVerifier?: string;
  proof?: any;
  action?: string;
  signal?: string;
  assertion?: any;
  challenge?: string;
  address?: string;
  signature?: string;
  message?: string;
  chainId?: number;
}

export interface TokenExchangeResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    roles?: string[];
    permissions?: string[];
    [key: string]: any;
  };
  raw?: any;
}

import { OAuthProviderServerConfig } from './types';

interface OAuthEndpoints {
  tokenUrl: string;
  userUrl?: string;
  method?: 'POST';
}

const PROVIDER_ENDPOINTS: Record<string, OAuthEndpoints> = {
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
  },
  kakao: {
    tokenUrl: 'https://kauth.kakao.com/oauth/token',
    userUrl: 'https://kapi.kakao.com/v2/user/me',
  },
  naver: {
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    userUrl: 'https://openapi.naver.com/v1/nid/me',
  },
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me',
  },
  line: {
    tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
    userUrl: 'https://api.line.me/v2/profile',
  },
  meta: {
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    userUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
  },
};

export class OAuthExchanger {
  private configs: Record<string, OAuthProviderServerConfig>;

  constructor(configs: Record<string, OAuthProviderServerConfig> = {}) {
    this.configs = configs;
  }

  async exchangeCode(
    providerName: string,
    code: string,
    options: { redirectUri?: string; codeVerifier?: string } = {}
  ): Promise<{ rawToken: any; profile: any }> {
    const config = this.configs[providerName];
    if (!config) {
      throw new Error(`[ISA-AUTH SERVER] Provider "${providerName}" is not configured on the server.`);
    }

    const endpoints = PROVIDER_ENDPOINTS[providerName];
    if (!endpoints) {
      throw new Error(`[ISA-AUTH SERVER] Unknown provider "${providerName}".`);
    }

    const redirectUri = options.redirectUri || config.redirectUri;
    if (!redirectUri && providerName !== 'github') {
      throw new Error(`[ISA-AUTH SERVER] redirectUri is required for ${providerName}.`);
    }

    // 1. Exchange code for access_token
    const bodyParams: Record<string, string> = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
    };

    if (redirectUri) {
      bodyParams.redirect_uri = redirectUri;
    }

    if (options.codeVerifier) {
      bodyParams.code_verifier = options.codeVerifier;
    }

    const tokenHeaders: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const tokenRes = await fetch(endpoints.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`[ISA-AUTH SERVER] ${providerName} token exchange failed (${tokenRes.status}): ${errText}`);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token || tokenData.accessToken;

    if (!accessToken) {
      throw new Error(`[ISA-AUTH SERVER] ${providerName} did not return access_token.`);
    }

    // 2. Fetch user profile if userUrl is defined
    let profile: any = {};
    if (endpoints.userUrl) {
      const userRes = await fetch(endpoints.userUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'isa-auth-server',
          Accept: 'application/json',
        },
      });

      if (userRes.ok) {
        profile = await userRes.json();
      }
    }

    const normalizedProfile = this.normalizeProfile(providerName, profile, tokenData);

    return {
      rawToken: tokenData,
      profile: normalizedProfile,
    };
  }

  private normalizeProfile(provider: string, profile: any, tokenData: any): any {
    switch (provider) {
      case 'google':
        return {
          id: profile.sub || profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.picture,
          provider: 'google',
        };
      case 'github':
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          avatar: profile.avatar_url,
          provider: 'github',
        };
      case 'kakao':
        return {
          id: String(profile.id),
          name: profile.kakao_account?.profile?.nickname || profile.properties?.nickname,
          email: profile.kakao_account?.email,
          avatar: profile.kakao_account?.profile?.profile_image_url,
          provider: 'kakao',
        };
      case 'naver':
        return {
          id: profile.response?.id,
          name: profile.response?.name || profile.response?.nickname,
          email: profile.response?.email,
          avatar: profile.response?.profile_image,
          provider: 'naver',
        };
      case 'discord':
        return {
          id: profile.id,
          name: profile.global_name || profile.username,
          email: profile.email,
          avatar: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
          provider: 'discord',
        };
      case 'line':
        return {
          id: profile.userId,
          name: profile.displayName,
          avatar: profile.pictureUrl,
          provider: 'line',
        };
      default:
        return {
          id: profile.id || profile.sub || 'unknown',
          name: profile.name,
          email: profile.email,
          avatar: profile.picture || profile.avatar,
          provider,
        };
    }
  }
}

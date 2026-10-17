import { ServerAuthConfig, TokenExchangePayload, TokenExchangeResponse } from './types';
import { JwtServerService } from './tokenService';
import { OAuthExchanger } from './oauthExchanger';
import { parseSiweMessage, verifyWorldIdProof, verifyPasskeyAssertionFormat } from './verifiers';

export class IsaAuthServer {
  private config: ServerAuthConfig;
  private jwtService: JwtServerService;
  private oauthExchanger: OAuthExchanger;

  constructor(config: ServerAuthConfig) {
    this.config = config;
    this.jwtService = new JwtServerService(config.jwt);
    this.oauthExchanger = new OAuthExchanger(config.providers || {});
  }

  async handleExchange(payload: TokenExchangePayload): Promise<TokenExchangeResponse> {
    if (!payload || !payload.type) {
      throw new Error('[ISA-AUTH SERVER] Invalid exchange payload: "type" is required.');
    }

    let user: any = null;
    let providerName = payload.provider || 'unknown';
    let rawResult: any = null;

    switch (payload.type) {
      case 'oauth_code': {
        if (!payload.provider || !payload.code) {
          throw new Error('[ISA-AUTH SERVER] "provider" and "code" are required for oauth_code exchange.');
        }
        providerName = payload.provider;
        const exchangeResult = await this.oauthExchanger.exchangeCode(payload.provider, payload.code, {
          redirectUri: payload.redirectUri,
          codeVerifier: payload.codeVerifier,
        });
        user = exchangeResult.profile;
        rawResult = exchangeResult.rawToken;
        break;
      }

      case 'web3_signature': {
        if (!payload.address || !payload.signature || !payload.message) {
          throw new Error('[ISA-AUTH SERVER] address, signature, and message are required for web3_signature exchange.');
        }
        providerName = 'web3';
        const parsed = parseSiweMessage(payload.message);
        if (!parsed) {
          throw new Error('[ISA-AUTH SERVER] Invalid SIWE message format.');
        }
        if (parsed.address.toLowerCase() !== payload.address.toLowerCase()) {
          throw new Error('[ISA-AUTH SERVER] SIWE message address does not match signed address.');
        }

        user = {
          id: payload.address.toLowerCase(),
          address: payload.address,
          name: `${payload.address.substring(0, 6)}...${payload.address.substring(payload.address.length - 4)}`,
          chainId: payload.chainId || parsed.chainId,
          provider: 'web3',
        };
        rawResult = { signature: payload.signature, siwe: parsed };
        break;
      }

      case 'world_id_proof': {
        providerName = 'world';
        const appId = this.config.worldId?.appId;
        if (!appId) {
          throw new Error('[ISA-AUTH SERVER] worldId.appId is not configured on the server.');
        }
        const action = payload.action || this.config.worldId?.action || 'login';
        const verifyRes = await verifyWorldIdProof(appId, action, payload.proof);
        if (!verifyRes.success) {
          throw new Error(`[ISA-AUTH SERVER] World ID verification failed: ${verifyRes.error}`);
        }

        user = {
          id: verifyRes.nullifierHash!,
          name: `World ID (${verifyRes.nullifierHash!.substring(0, 8)})`,
          verified: true,
          provider: 'world',
        };
        rawResult = verifyRes;
        break;
      }

      case 'passkey_assertion': {
        providerName = 'passkey';
        const passkeyRes = verifyPasskeyAssertionFormat(payload.assertion, payload.challenge);
        if (!passkeyRes.success) {
          throw new Error(`[ISA-AUTH SERVER] Passkey assertion verification failed: ${passkeyRes.error}`);
        }

        user = {
          id: passkeyRes.userHandle || payload.assertion.id,
          name: `Passkey User (${passkeyRes.userHandle || payload.assertion.id})`,
          credentialId: payload.assertion.id,
          provider: 'passkey',
        };
        rawResult = payload.assertion;
        break;
      }

      default:
        throw new Error(`[ISA-AUTH SERVER] Unsupported exchange type: "${payload.type}".`);
    }

    // Optional user enhancement hook
    if (this.config.onUserResolved) {
      user = (await this.config.onUserResolved(user, providerName, rawResult)) || user;
    }

    // Default roles & permissions if not provided
    if (!user.roles) {
      user.roles = ['USER'];
    }
    if (!user.permissions) {
      user.permissions = [];
    }

    // Generate JWT access token & optional refresh token
    const expiresIn = this.config.jwt.expiresInSeconds || 3600;
    const accessToken = this.jwtService.sign({
      sub: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      provider: providerName,
    }, expiresIn);

    const refreshToken = this.jwtService.sign({
      sub: user.id,
      type: 'refresh',
      provider: providerName,
    }, expiresIn * 7); // 7 days

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      user,
      raw: rawResult,
    };
  }

  verifyToken(token: string): any | null {
    return this.jwtService.verify(token);
  }
}

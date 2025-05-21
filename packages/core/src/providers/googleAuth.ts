import { OAuth2Client } from 'google-auth-library';

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleAuthProvider {
  private client: OAuth2Client;

  constructor(private config: GoogleAuthConfig) {
    this.client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  generateAuthUrl(scopes: string[]): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }

  async verifyIdToken(idToken: string) {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.config.clientId,
    });
    return ticket.getPayload();
  }
}
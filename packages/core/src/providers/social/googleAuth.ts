import { loadCDN } from 'isa-util';
import type { AuthProvider } from '../authProvider';

declare global {
  interface Window {
    google?: any;
  }
}

export class GoogleAuthProvider implements AuthProvider {
  private clientId: string;
  private callback: (token: string) => string | Promise<string>;

  constructor({
    clientId,
    callback,
  }: {
    clientId: string;
    callback: (token: string) => string | Promise<string>;
  }) {
    this.clientId = clientId;
    this.callback = callback;
  }

  async loadGoogleSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.google && window.google.accounts?.id) {
      return;
    }
    await loadCDN('google-gsi', 'https://accounts.google.com/gsi/client', {
      async: true,
      defer: true,
    });
  }

  async init() {
    await this.loadGoogleSdk();
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          this.callback(response.credential);
        },
      });
    }
  }

  signIn() {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.prompt();
    } else {
      console.error('Google SDK is not loaded');
    }
  }

  signOut() {
    if (typeof window !== 'undefined' && window.google?.accounts) {
      try {
        if (typeof window.google.accounts.id?.disableAutoSelect === 'function') {
          window.google.accounts.id.disableAutoSelect();
        }
      } catch (e) {
        // ignore
      }
      try {
        if (typeof window.google.accounts.oauth2?.revokeAccessToken === 'function') {
          window.google.accounts.oauth2.revokeAccessToken();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  async getAccessToken() {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      if (typeof window.google.accounts.oauth2.getAccessToken === 'function') {
        const token = await window.google.accounts.oauth2.getAccessToken();
        return token;
      }
    }
    return null;
  }

  async getUserInfo() {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      if (typeof window.google.accounts.id.getUserInfo === 'function') {
        const user = await window.google.accounts.id.getUserInfo();
        return user;
      }
    }
    return null;
  }
}

export default GoogleAuthProvider;

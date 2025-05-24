import { loadCDN } from 'isa-util';
import type { AuthProvider } from './authProvider';

declare global {
  interface Window {
    google?: any;
  }
}

class GoogleAuthProvider implements AuthProvider {
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

  loadGoogleSdk(): Promise<void> {
    return new Promise((resolve) => {
      if (window.google && window.google.accounts?.id) {
        return resolve();
      }
      loadCDN('google-gsi', 'https://accounts.google.com/gsi/client', {
        async: true,
        defer: true,
        onload: () => resolve(),
      });
    });
  }

  async init() {
    await this.loadGoogleSdk();
    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: any) => {
        this.callback(response.credential);
      },
    });
  }
  signIn() {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.prompt();
    } else {
      console.error('Google SDK is not loaded');
    }
  }
  signOut() {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.revoke('EMAIL', (response: any) => {
        console.log('User signed out');
      });
      window.google.accounts.oauth2.revokeAccessToken();
    } else {
      console.error('Google SDK is not loaded');
    }
  }
  async getAccessToken() {
    if (typeof window !== 'undefined' && window.google) {
      const token = await window.google.accounts.oauth2.getAccessToken();
      return token;
    } else {
      console.error('Google SDK is not loaded');
    }
  }
  async getUserInfo() {
    if (typeof window !== 'undefined' && window.google) {
      const user = await window.google.accounts.id.getUserInfo();
      return user;
    } else {
      console.error('Google SDK is not loaded');
    }
  }
}

export default GoogleAuthProvider;

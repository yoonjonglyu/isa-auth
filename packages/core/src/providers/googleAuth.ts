import { loadCDN } from 'isa-util';

declare global {
  interface Window {
    google?: any;
  }
}

export const loadGoogleSdk = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.google && window.google.accounts?.id) {
      return resolve();
    }
    loadCDN('google-gsi', 'https://accounts.google.com/gsi/client', {
      async: true,
      defer: true,
      onload: () => resolve(),
    });
  });

export const initGoogleAuth = async (
  clientId: string,
  callback: (token: string) => string | Promise<string>,
) => {
  await loadGoogleSdk();

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: any) => {
      callback(response.credential);
    },
  });
};

export const signIn = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.prompt();
  } else {
    console.error('Google SDK is not loaded');
  }
};
export const signOut = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.revoke('EMAIL', (response: any) => {
      console.log('User signed out');
    });
  } else {
    console.error('Google SDK is not loaded');
  }
};
export const getUserInfo = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.getUserInfo().then((user: any) => {
      console.log('User info:', user);
    });
  } else {
    console.error('Google SDK is not loaded');
  }
};
export const getAccessToken = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.oauth2.getAccessToken().then((token: any) => {
      console.log('Access token:', token);
    });
  } else {
    console.error('Google SDK is not loaded');
  }
};
export const revokeAccessToken = () => {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.oauth2.revokeAccessToken().then(() => {
      console.log('Access token revoked');
    });
  } else {
    console.error('Google SDK is not loaded');
  }
};

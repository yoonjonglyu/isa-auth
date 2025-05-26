import {
  initStore,
  getAccessToken,
  setAccessToken,
  getAuthInfo,
  getAuthState,
  setAuthInfo,
  setAuthState,
  watchAuthState,
} from './store';
import { getAuthService, AuthServiceType } from './service';
import { getProvider, ProviderType } from './providers';

import {
  addAuthEventListener,
  removeAuthEventListener,
  dispatchAuthEvent,
} from './event/customAuth';
import { getButton, ButtonType } from './components';
// 좀 더 정리해야함. 일단 기본적인 틀은 이런 느낌으로
class AuthCore {
  private service: ReturnType<typeof getAuthService>;
  private provider: ReturnType<typeof getProvider>;
  private button: ReturnType<typeof getButton>;

  constructor({
    serviceType = 'base',
    providerType = 'none',
    buttonType = 'none',
  }: {
    serviceType: AuthServiceType;
    providerType: ProviderType;
    buttonType: ButtonType;
  }) {
    if (serviceType === 'base' && providerType !== 'none') {
      throw new Error('base service does not support provider.');
    }
    initStore(false);
    this.service = getAuthService(serviceType);
    this.provider = getProvider(providerType);
    this.button = getButton(buttonType);
  }
  getService() {
    return this.service;
  }
  getProvider() {
    return this.provider;
  }
  getButton() {
    return this.button;
  }
  getAccessToken() {
    return getAccessToken();
  }
  getAuthInfo() {
    return getAuthInfo();
  }
  getAuthState() {
    return getAuthState();
  }
  setAccessToken(token: string) {
    setAccessToken(token);
  }
  getWebComponentAPI() {
    return {
      addAuthEventListener,
      removeAuthEventListener,
      dispatchAuthEvent,
      watchAuthState,
    };
  }
}

export default AuthCore;

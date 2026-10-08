import { getAuthService } from './service';
import { getProvider } from './providers';
import { getButton } from './components';
import {
  addAuthEventListener,
  removeAuthEventListener,
  dispatchAuthEvent,
} from './event/customAuth';
import {
  providerToButtonMap,
  providerToServiceMap,
  CoreProviderType,
} from './mappings';
import { AuthLifecycleManager } from './lifecycle';
import { createAuthGuard, AuthGuardOptions } from './guard';
import { createAuthFetch, AuthFetchOptions } from './http';
import { configureStorage, StorageType } from './store';

export type { CoreProviderType };
export type CoreProvicerType = CoreProviderType; // Backwards compatibility alias

export interface AuthCoreProps {
  providerType?: CoreProviderType;
  secret?: string;
  storage?: StorageType;
}

class AuthCore {
  private provider: ReturnType<typeof getProvider>;
  private button: ReturnType<typeof getButton>;
  private serviceInstance: InstanceType<ReturnType<typeof getAuthService>>;
  public lifecycle: AuthLifecycleManager;

  constructor({
    providerType = 'base',
    secret = 'isa-auth-secret',
    storage = 'localStorage',
  }: AuthCoreProps = {}) {
    configureStorage(storage);

    const serviceType = providerToServiceMap[providerType] ?? 'base';
    const buttonType = providerToButtonMap[providerType] ?? 'none';
    const isProviderRequired =
      providerType !== 'base' && providerType !== 'jwt';

    const ServiceClass = getAuthService(serviceType);
    this.serviceInstance = new ServiceClass(secret);

    this.provider = getProvider(isProviderRequired ? providerType : 'none');
    this.button = getButton(buttonType);
    this.lifecycle = new AuthLifecycleManager();

    // Bind state watcher to lifecycle events
    this.serviceInstance.watchAuthState((isAuthenticated) => {
      if (isAuthenticated) {
        this.lifecycle.emit('signIn', {
          user: this.serviceInstance.getAuthInfo(),
          token: (this.serviceInstance as any).getAccessToken?.(),
        });
        dispatchAuthEvent('isa-auth-login', {
          user: this.serviceInstance.getAuthInfo(),
        });
      } else {
        this.lifecycle.emit('signOut');
        dispatchAuthEvent('isa-auth-logout', {});
      }
    });
  }

  // 서비스 인스턴스 (state 관리)
  getService() {
    return this.serviceInstance;
  }

  // OAuth / Web3 프로바이더 생성자 (미사용 시 null)
  getProvider() {
    return this.provider;
  }

  // 버튼 컴포넌트 메타데이터 인스턴스
  getButton() {
    return this.button;
  }

  // 권한 가드 생성기
  createGuard(options: AuthGuardOptions) {
    const isAuthed = this.serviceInstance.getAuthState();
    const info = this.serviceInstance.getAuthInfo() || {};
    return createAuthGuard(options)({
      isAuthenticated: isAuthed,
      roles: info.roles || (info.role ? [info.role] : []),
      permissions: info.permissions || [],
    });
  }

  // 인증 연동 fetch 클라이언트 생성
  createFetch(options?: Partial<AuthFetchOptions>) {
    return createAuthFetch({
      authClient: this.serviceInstance as any,
      ...options,
    });
  }

  // 웹 컴포넌트 친화적 API
  getWebComponentAPI() {
    return {
      addAuthEventListener,
      removeAuthEventListener,
      dispatchAuthEvent,
      watchAuthState: this.serviceInstance.watchAuthState.bind(
        this.serviceInstance,
      ),
    };
  }
}

export default AuthCore;

import { getAuthService, AutoRefreshOptions } from './service';
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
import {
  createAuthGuard,
  evaluateGuard,
  checkRole,
  checkPermission,
  AuthGuardOptions,
  AuthContext,
  GuardResult,
} from './guard';
import {
  createAuthFetch,
  applyAuthInterceptor,
  createAuthAxios,
  AuthFetchOptions,
  AuthHttpOptions,
} from './http';
import {
  HttpTokenExchangeAdapter,
  HttpTokenExchangeOptions,
  TokenExchangeAdapter,
  TokenExchangeResult,
} from './service/tokenExchange';
import { configureStorage, StorageType } from './store';

export type { CoreProviderType };
export type CoreProvicerType = CoreProviderType; // Backwards compatibility alias

export interface AuthCoreProps {
  providerType?: CoreProviderType;
  secret?: string;
  storage?: StorageType;
  storagePrefix?: string;
}

class AuthCore {
  private provider: ReturnType<typeof getProvider>;
  private button: ReturnType<typeof getButton>;
  private serviceInstance: InstanceType<ReturnType<typeof getAuthService>>;
  public lifecycle: AuthLifecycleManager;

  constructor({
    providerType = 'base',
    secret = 'isa-auth-secret',
    storage = 'memory',
    storagePrefix = '',
  }: AuthCoreProps = {}) {
    configureStorage({
      type: storage,
      prefix: storagePrefix,
    });

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

  // 현재 인증/인가 컨텍스트 생성
  getContext(): AuthContext {
    const isAuthed = this.serviceInstance.getAuthState();
    const info = this.serviceInstance.getAuthInfo() || {};
    return {
      isAuthenticated: isAuthed,
      roles: info.roles || (info.role ? [info.role] : []),
      permissions: info.permissions || [],
      user: info,
    };
  }

  // 사용자 정보 부분 업데이트
  updateAuthInfo<T = any>(partial: Partial<T>): T {
    return (this.serviceInstance as any).updateAuthInfo(partial);
  }

  // 토큰 자동 갱신 스케줄러 시작
  startAutoRefresh(refreshFn: () => Promise<string>, options?: AutoRefreshOptions) {
    if ('startAutoRefresh' in this.serviceInstance) {
      (this.serviceInstance as any).startAutoRefresh(refreshFn, {
        onSuccess: (token: string) => {
          this.lifecycle.emit('tokenRefreshed', { token });
        },
        onError: (error: any) => {
          this.lifecycle.emit('error', { error, phase: 'autoRefresh' });
        },
        ...options,
      });
    }
  }

  // 토큰 자동 갱신 중지
  stopAutoRefresh() {
    if ('stopAutoRefresh' in this.serviceInstance) {
      (this.serviceInstance as any).stopAutoRefresh();
    }
  }

  // 권한 가드 평가 (상세 결과 반환 및 전역 라이프사이클 이벤트 연동)
  async evaluateGuard(options: AuthGuardOptions, customContext?: Partial<AuthContext>): Promise<GuardResult> {
    const context: AuthContext = {
      ...this.getContext(),
      ...customContext,
    };

    const result = await evaluateGuard(options, context);

    if (!result.allowed) {
      this.lifecycle.emit('unauthorized', {
        reason: result.message || 'Unauthorized',
        result,
        context,
        timestamp: Date.now(),
      });
      this.lifecycle.emit('accessDenied', {
        reason: result.message || 'Access denied',
        result,
        context,
        target: options.target,
        timestamp: Date.now(),
      });
    }

    return result;
  }

  // 권한 가드 검사 (즉시 boolean 반환 - 기존 하위 호환성 유지)
  async createGuard(options: AuthGuardOptions) {
    const context = this.getContext();
    const guardFn = createAuthGuard(options);
    const passed = await guardFn(context);

    if (!passed) {
      this.lifecycle.emit('unauthorized', {
        reason: 'Unauthorized access',
        context,
        timestamp: Date.now(),
      });
      this.lifecycle.emit('accessDenied', {
        reason: 'Guard check failed',
        context,
        target: options.target,
        timestamp: Date.now(),
      });
    }

    return passed;
  }

  // 역할 검사 편의 메서드
  hasRole(role: string | string[], matchAll = false): boolean {
    const context = this.getContext();
    return checkRole(role, context.roles || [], matchAll);
  }

  // 권한 검사 편의 메서드 (와일드카드 지원)
  hasPermission(permission: string | string[], matchAll = true): boolean {
    const context = this.getContext();
    return checkPermission(permission, context.permissions || [], matchAll);
  }

  // 인증 연동 fetch 클라이언트 생성
  createFetch(options?: Partial<AuthFetchOptions>) {
    return createAuthFetch({
      authClient: this.serviceInstance as any,
      ...options,
    });
  }

  // Axios 인스턴스에 인증 인터셉터 장착
  applyAxiosInterceptor(axiosInstance: any, options?: Partial<AuthHttpOptions>) {
    return applyAuthInterceptor(axiosInstance, {
      authClient: this.serviceInstance as any,
      ...options,
    });
  }

  // 인증 인터셉터가 적용된 Axios 인스턴스 생성
  createAxios(axiosModuleOrInstance: any, options?: Partial<AuthHttpOptions>) {
    return createAuthAxios(axiosModuleOrInstance, {
      authClient: this.serviceInstance as any,
      ...options,
    });
  }

  // 백엔드 토큰 교환 어댑터 생성
  createTokenExchange(tokenEndpoint: string, options?: Omit<HttpTokenExchangeOptions, 'tokenEndpoint'>) {
    return new HttpTokenExchangeAdapter({
      tokenEndpoint,
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

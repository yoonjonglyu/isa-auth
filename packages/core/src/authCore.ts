import { getAuthService, AuthServiceType } from './service';
import { getProvider, ProviderType } from './providers';

import { getButton } from './components';
import {
  addAuthEventListener,
  removeAuthEventListener,
  dispatchAuthEvent,
} from './event/customAuth';
import {
  providerToButtonMap,
  providerToServiceMap,
  CoreProvicerType,
} from './mappings';

// AuthCore.ts
interface AuthCoreProps {
  providerType: CoreProvicerType;
  secret?: string;
}

// provider와 service를 결합한 로직을 만들고 싶은데 어떻게 하는게 좋을까 고민중.
// 그냥 core에서 이 정도만 관리하고 외부 pkg에서 결합해도 되긴함.
class AuthCore {
  private provider: ReturnType<typeof getProvider>;
  private button: ReturnType<typeof getButton>;
  private serviceInstance: InstanceType<ReturnType<typeof getAuthService>>;

  constructor({
    providerType = 'base',
    secret = 'isa-auth-secret',
  }: AuthCoreProps) {
    const serviceType = providerToServiceMap[providerType] ?? 'base';
    const buttonType = providerToButtonMap[providerType] ?? 'none';
    const isProviderRequired =
      providerType !== 'base' && providerType !== 'jwt';

    const ServiceClass = getAuthService(serviceType);
    this.serviceInstance = new ServiceClass(secret);
    this.serviceInstance.initStore(false);

    this.provider = getProvider(isProviderRequired ? providerType : 'none');
    this.button = getButton(buttonType);
  }
  // 서비스 인스턴스(state관리)
  getService() {
    return this.serviceInstance;
  }
  // 외부 OAuth 서비스 사용을 안할시 null을 리턴함.
  getProvider() {
    return this.provider;
  }
  // 버튼 컴포넌트 데이터를 담은 객체를 리턴함.
  getButton() {
    return this.button;
  }
  // 웹컴포넌트용 API들
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

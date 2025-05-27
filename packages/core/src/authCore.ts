import { getAuthService, AuthServiceType } from './service';
import { getProvider, ProviderType } from './providers';

import { getButton, ButtonType } from './components';
import {
  addAuthEventListener,
  removeAuthEventListener,
  dispatchAuthEvent,
} from './event/customAuth';
// AuthCore.ts
interface AuthCoreProps {
  providerType?: ProviderType | AuthServiceType;
  buttonType?: ButtonType;
  secret?: string;
}
// provider와 service를 결합한 로직을 만들고 싶은데 어떻게 하는게 좋을까 고민중. 그냥 core에서 이 정도만 관리하고 외부에서 결합해도 되긴함.
class AuthCore {
  private _service: ReturnType<typeof getAuthService>;
  private provider: ReturnType<typeof getProvider>;
  private button: ReturnType<typeof getButton>;
  private serviceInstance: InstanceType<ReturnType<typeof getAuthService>>;

  constructor({
    providerType = 'none',
    buttonType = 'none',
    secret = 'isa-auth-secret',
  }: AuthCoreProps) {
    // service 는 현재 state만쓰는 base와 jwt로 나뉘어져있음 추후 블록체인 서비스 추가 예정.
    this._service = getAuthService(providerType === 'base' ? 'base' : 'jwt');
    // provider 는 현재 base와 jwt 그리고 providerType에 따라 있음
    this.provider = getProvider(
      providerType !== 'base' && providerType !== 'jwt' ? providerType : 'none',
    );
    this.button = getButton(buttonType);
    this.serviceInstance = new this._service(secret);
    this.serviceInstance.initStore(false);
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

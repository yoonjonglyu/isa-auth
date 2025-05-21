export type AuthButtonType = 'rect' | 'rounded' | 'circle' | 'link' | 'brand';
export type ProviderType =
  | 'default'
  | 'google'
  | 'apple'
  | 'kakao'
  | 'line'
  | 'naver'
  | 'facebook'
  | 'twitter'
  | 'wechat';

export interface LoginButtonConfig {
  id: string;
  style?: Partial<CSSStyleDeclaration>;
  text?: string;
  icon?: string;
  fullWidth?: boolean;
}

export interface LoginButtonProps {
  type: AuthButtonType;
  provider: ProviderType;
  action: Function;
  config: LoginButtonConfig;
}
/**
 *  @description provider 타입을 좀 더 구체적으로 해야하나?
 * core package에서는 단순한 컴포넌트 정보를 담은 json인데 여기에 action이 필요한가?
 * 외부에서 주입하는 props는 그러려니하지만 기본적인 공통 props는 좀 더 명확히 정의 내릴 수 있지않을까?
 */
class LoginButton {
  readonly type: AuthButtonType;
  readonly provider: ProviderType;
  readonly action: Function;
  readonly config: LoginButtonConfig;

  constructor(props: LoginButtonProps) {
    this.type = props.type;
    this.provider = props.provider;
    this.action = props.action;
    this.config = props.config;
  }

  private getDefaultText(): string {
    switch (this.provider) {
      case 'google':
        return 'Sign in with Google';
      case 'apple':
        return 'Sign in with Apple';
      case 'kakao':
        return '카카오로 로그인';
      default:
        return '로그인';
    }
  }

  private getDefaultStyle(): Partial<CSSStyleDeclaration> {
    switch (this.type) {
      case 'rect':
        return {
          padding: '10px 20px',
          borderRadius: '4px',
          fontSize: '14px',
        };
      case 'rounded':
        return {
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '14px',
        };
      case 'circle':
        return {
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          padding: '0',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };
      case 'link':
        return {
          backgroundColor: 'transparent',
          color: '#007bff',
          textDecoration: 'underline',
          fontSize: '14px',
          border: 'none',
        };
      case 'brand':
        return {
          backgroundColor: '#000',
          color: '#fff',
          padding: '12px 24px',
          fontWeight: 'bold',
          fontSize: '16px',
        };
      default:
        return {};
    }
  }

  private mergeStyles(): Partial<CSSStyleDeclaration> {
    return {
      ...this.getDefaultStyle(),
      ...this.config.style,
    };
  }

  getButtonClass(): string {
    const base = 'isa-auth-button';
    const typeClass = `login-button-${this.type}`;
    const providerClass = `auth-button-${this.provider}`;
    const widthClass = this.config.fullWidth ? 'full-width' : '';
    return [base, typeClass, providerClass, widthClass].join(' ').trim();
  }

  toJSON() {
    return {
      id: this.config.id,
      type: this.type,
      provider: this.provider,
      icon: this.config.icon ?? `/icons/${this.provider}.svg`,
      text: this.config.text ?? this.getDefaultText(),
      style: this.mergeStyles(),
      fullWidth: this.config.fullWidth ?? false,
      className: this.getButtonClass(),
      onClick: this.action,
    };
  }
}

export default LoginButton;

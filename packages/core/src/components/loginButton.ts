import { providerIcons } from './icons';

export type AuthButtonType = 'rect' | 'rounded' | 'circle' | 'link' | 'brand';
export type ButtonProviderType =
  | 'default'
  | 'google'
  | 'apple'
  | 'kakao'
  | 'line'
  | 'naver'
  | 'facebook'
  | 'meta'
  | 'twitter'
  | 'wechat'
  | 'web3'
  | 'github'
  | 'discord'
  | 'world'
  | 'passkey';

export interface LoginButtonConfig {
  id: string;
  style?: Partial<CSSStyleDeclaration>;
  text?: string;
  icon?: string;
  svg?: string;
  fullWidth?: boolean;
}

export interface LoginButtonProps {
  type: AuthButtonType;
  provider: ButtonProviderType;
  action: Function;
  config: LoginButtonConfig;
}

class LoginButton {
  readonly type: AuthButtonType;
  readonly provider: ButtonProviderType;
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
        return 'Google로 계속하기';
      case 'apple':
        return 'Apple로 로그인';
      case 'kakao':
        return '카카오 로그인';
      case 'naver':
        return '네이버 로그인';
      case 'web3':
        return 'Web3 지갑 연결 (SIWE)';
      case 'meta':
      case 'facebook':
        return 'Meta로 로그인';
      case 'line':
        return 'LINE 로그인';
      case 'github':
        return 'GitHub 로그인';
      case 'discord':
        return 'Discord 로그인';
      case 'world':
        return 'World ID 본인인증 (Orb)';
      case 'passkey':
        return 'Passkey 생체인증';
      default:
        return '로그인';
    }
  }

  private getProviderBrandStyle(): Partial<CSSStyleDeclaration> {
    switch (this.provider) {
      case 'google':
        return {
          backgroundColor: '#FFFFFF',
          color: '#3C4043',
          border: '1px solid #DADCE0',
          boxShadow: '0 1px 3px rgba(60,64,67,0.08), 0 1px 2px rgba(60,64,67,0.05)',
        };
      case 'apple':
        return {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        };
      case 'kakao':
        return {
          backgroundColor: '#FEE500',
          color: '#191919',
          border: 'none',
          boxShadow: '0 2px 4px rgba(254, 229, 0, 0.25)',
        };
      case 'naver':
        return {
          backgroundColor: '#03C75A',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 4px rgba(3, 199, 90, 0.25)',
        };
      case 'meta':
      case 'facebook':
        return {
          backgroundColor: '#0866FF',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 4px rgba(8, 102, 255, 0.25)',
        };
      case 'line':
        return {
          backgroundColor: '#06C755',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 4px rgba(6, 199, 85, 0.25)',
        };
      case 'github':
        return {
          backgroundColor: '#24292F',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
        };
      case 'discord':
        return {
          backgroundColor: '#5865F2',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 4px rgba(88, 101, 242, 0.25)',
        };
      case 'web3':
        return {
          backgroundColor: '#4338CA',
          backgroundImage: 'linear-gradient(135deg, #627EEA 0%, #3B82F6 100%)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 6px rgba(98, 126, 234, 0.35)',
        };
      case 'world':
        return {
          backgroundColor: '#111827',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
        };
      case 'passkey':
        return {
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#38BDF8',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 2px 6px rgba(56, 189, 248, 0.15)',
        };
      default:
        return {
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          border: 'none',
        };
    }
  }

  private getDefaultStyle(): Partial<CSSStyleDeclaration> {
    const brand = this.getProviderBrandStyle();
    const common: Partial<CSSStyleDeclaration> = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: '600',
      letterSpacing: '-0.01em',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      ...brand,
    };

    switch (this.type) {
      case 'rect':
        return {
          ...common,
          padding: '11px 18px',
          borderRadius: '10px',
          fontSize: '14.5px',
        };
      case 'rounded':
        return {
          ...common,
          padding: '11px 22px',
          borderRadius: '9999px',
          fontSize: '14.5px',
        };
      case 'circle':
        return {
          ...common,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          padding: '0',
          fontSize: '16px',
        };
      case 'link':
        return {
          ...common,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          color: brand.color || '#4F46E5',
          textDecoration: 'underline',
          fontSize: '14px',
          padding: '4px 8px',
        };
      case 'brand':
        return {
          ...common,
          padding: '13px 26px',
          borderRadius: '12px',
          fontSize: '15.5px',
          fontWeight: '700',
        };
      default:
        return common;
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
      svg: this.config.svg || providerIcons[this.provider] || '',
      icon: this.config.icon,
      text: this.config.text ?? this.getDefaultText(),
      style: this.mergeStyles(),
      fullWidth: this.config.fullWidth ?? false,
      className: this.getButtonClass(),
      onClick: this.action,
    };
  }
}

export default LoginButton;

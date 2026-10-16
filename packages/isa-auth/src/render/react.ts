/**
 * React Type-Safe Wrapper Component for ISA-AUTH Buttons
 * Provides 100% TypeScript Props & Event IntelliSense
 */
import type { CoreProviderType } from 'isa-auth-core';
import type { IsaAuth } from '../index';

export interface IsaAuthButtonProps {
  auth?: IsaAuth;
  provider: CoreProviderType;
  label?: string;
  className?: string;
  style?: Record<string, string | number>;
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  children?: any;
}

/**
 * Creates a strongly typed React Component from an IsaAuth instance
 */
export function createReactAuthButton(authInstance: IsaAuth) {
  return function IsaAuthButton(props: IsaAuthButtonProps) {
    const { provider, label, className, style, onSuccess, onError, children } = props;
    const targetAuth = props.auth || authInstance;

    if (typeof window === 'undefined') {
      return null;
    }

    const React = (window as any).React;
    if (!React) {
      console.warn('[ISA-AUTH] React is required to render IsaAuthButton.');
      return null;
    }

    const handleClick = async () => {
      try {
        const res = await targetAuth.signIn(provider);
        if (onSuccess) onSuccess(res || targetAuth.getUserInfo());
      } catch (err) {
        if (onError) onError(err);
      }
    };

    const buttonData = (targetAuth as any).getButton?.(provider);
    const data = typeof buttonData?.toJSON === 'function' ? buttonData.toJSON() : buttonData || {};

    const buttonStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
      width: '100%',
      ...data.style,
      ...style,
    };

    const iconElement = data.svg
      ? React.createElement('span', {
          className: 'isa-auth-icon',
          dangerouslySetInnerHTML: { __html: data.svg },
          style: { display: 'inline-flex', alignItems: 'center' },
        })
      : null;

    return React.createElement(
      'button',
      {
        type: 'button',
        onClick: handleClick,
        className: className || data.className || 'isa-auth-button',
        style: buttonStyle,
        'data-provider': provider,
      },
      iconElement,
      React.createElement('span', null, children || label || data.text || `Sign in with ${provider}`)
    );
  };
}

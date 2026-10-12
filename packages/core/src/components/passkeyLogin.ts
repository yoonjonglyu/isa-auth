import LoginButton, { type LoginButtonProps } from './loginButton';

export const passkeyLoginButton = new LoginButton({
  type: 'rounded',
  provider: 'passkey',
  action: () => {},
  config: {
    id: 'isa-auth-btn-passkey',
    text: 'Sign in with Passkey',
    icon: '/icons/passkey.svg',
    fullWidth: false,
    style: {
      backgroundColor: '#1E293B',
      color: '#F8FAFC',
      border: '1px solid #334155',
    },
  },
});

export default passkeyLoginButton;

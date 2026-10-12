import LoginButton, { type LoginButtonProps } from './loginButton';

export const worldLoginButton = new LoginButton({
  type: 'rounded',
  provider: 'world',
  action: () => {},
  config: {
    id: 'isa-auth-btn-world',
    text: 'Verify with World ID (Orb)',
    icon: '/icons/world.svg',
    fullWidth: false,
    style: {
      backgroundColor: '#000000',
      color: '#FFFFFF',
      border: '1px solid #333333',
    },
  },
});

export default worldLoginButton;

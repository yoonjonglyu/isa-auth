import LoginButton from './loginButton';

const discordLoginButton = new LoginButton({
  type: 'rect',
  provider: 'discord',
  action: () => console.log('Discord 로그인 시도'),
  config: {
    id: 'login-discord',
    text: 'Sign in with Discord',
    fullWidth: true,
    style: {
      backgroundColor: '#5865F2',
      color: '#ffffff',
    },
  },
});

export default discordLoginButton;

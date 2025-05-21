import LoginButton from './loginButton';

const googleLoginButton = new LoginButton({
  type: 'rect',
  provider: 'google',
  action: () => console.log('로그인 시도'),
  config: {
    id: 'login-google',
    text: 'Google 계정으로 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#fff',
      color: '#000',
    },
  },
});

export default googleLoginButton;

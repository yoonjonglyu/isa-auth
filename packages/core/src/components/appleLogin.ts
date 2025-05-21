import LoginButton from './loginButton';

const appleLoginButton = new LoginButton({
  type: 'rect',
  provider: 'apple',
  action: () => console.log('로그인 시도'),
  config: {
    id: 'login-apple',
    text: 'Apple 계정으로 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#000',
      color: '#fff',
    },
  },
});

export default appleLoginButton;

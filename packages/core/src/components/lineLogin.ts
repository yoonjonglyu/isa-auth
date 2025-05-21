import LoginButton from './loginButton';

const lineLoginButton = new LoginButton({
  type: 'rect',
  provider: 'line',
  action: () => console.log('로그인 시도'),
  config: {
    id: 'login-line',
    text: 'LINE 계정으로 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#00C300',
      color: '#fff',
    },
  },
});

export default lineLoginButton;

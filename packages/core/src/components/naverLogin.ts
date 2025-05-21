import LoginButton from './loginButton';

const naverLoginButton = new LoginButton({
  type: 'rect',
  provider: 'naver',
  action: () => console.log('로그인 시도'),
  config: {
    id: 'login-naver',
    text: 'Naver 계정으로 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#03C75A',
      color: '#fff',
    },
  },
});

export default naverLoginButton;

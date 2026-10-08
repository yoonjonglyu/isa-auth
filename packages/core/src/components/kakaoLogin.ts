import LoginButton from './loginButton';

const kakaoLoginButton = new LoginButton({
  type: 'rect',
  provider: 'kakao',
  action: () => console.log('카카오 로그인 시도'),
  config: {
    id: 'login-kakao',
    text: '카카오 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#FEE500',
      color: '#000000',
    },
  },
});

export default kakaoLoginButton;

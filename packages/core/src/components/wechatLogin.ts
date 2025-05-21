import LoginButton from './loginButton';

const wechatLoginButton = new LoginButton({
  type: 'rect',
  provider: 'wechat',
  action: () => console.log('로그인 시도'),
  config: {
    id: 'login-wechat',
    text: 'WeChat 계정으로 로그인',
    fullWidth: true,
    style: {
      backgroundColor: '#00BFFF',
      color: '#fff',
    },
  },
});

export default wechatLoginButton;

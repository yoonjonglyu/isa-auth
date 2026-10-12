import LoginButton from './loginButton';

const githubLoginButton = new LoginButton({
  type: 'rect',
  provider: 'github',
  action: () => console.log('GitHub 로그인 시도'),
  config: {
    id: 'login-github',
    text: 'Sign in with GitHub',
    fullWidth: true,
    style: {
      backgroundColor: '#24292e',
      color: '#ffffff',
    },
  },
});

export default githubLoginButton;

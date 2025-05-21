import LoginButton from './loginButton';

const googleLoginButton = new LoginButton({
  label: 'Google',
  action: () => {
    console.log('Google login action');
  },
  config: {
    id: 'google',
    type: 'default',
    style: {
      backgroundColor: '#4285F4',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.3s ease',
    },
  },
});

export default googleLoginButton;

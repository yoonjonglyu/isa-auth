import LoginButton from './loginButton';

const web3LoginButton = new LoginButton({
  type: 'rect',
  provider: 'web3',
  action: () => console.log('Web3 지갑 연결 시도'),
  config: {
    id: 'login-web3',
    text: 'Connect Ethereum Wallet',
    fullWidth: true,
    style: {
      backgroundColor: '#627EEA',
      color: '#FFFFFF',
    },
  },
});

export default web3LoginButton;

import googleLoginButton from './googleLogin';
import appleLoginButton from './appleLogin';
import lineLoginbutton from './lineLogin';
import naverLoginButton from './naverLogin';
import wechatLoginButton from './wechatLogin';
import metaLoginButton from './metaLogin';
import kakaoLoginButton from './kakaoLogin';
import web3LoginButton from './web3Login';

const buttons = {
  google: googleLoginButton,
  kakao: kakaoLoginButton,
  naver: naverLoginButton,
  apple: appleLoginButton,
  line: lineLoginbutton,
  wechat: wechatLoginButton,
  meta: metaLoginButton,
  web3: web3LoginButton,
  none: null,
};

export type ButtonType = keyof typeof buttons;

export const getButton = (provider: ButtonType) => {
  if (provider === 'none') {
    return null;
  }
  const button = buttons[provider];
  if (!button) {
    throw new Error(`[ISA-AUTH] Button "${provider}" not found`);
  }
  return button;
};

export {
  googleLoginButton,
  kakaoLoginButton,
  naverLoginButton,
  appleLoginButton,
  lineLoginbutton,
  wechatLoginButton,
  metaLoginButton,
  web3LoginButton,
};
export * from './loginButton';

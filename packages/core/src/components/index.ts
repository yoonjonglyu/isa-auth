import googleLoginButton from './googleLogin';
import appleLoginButton from './appleLogin';
import lineLoginbutton from './lineLogin';
import naverLoginButton from './naverLogin';
import wechatLoginButton from './wechatLogin';
import metaLoginButton from './MetaLogin';

const buttons = {
  google: googleLoginButton,
  apple: appleLoginButton,
  line: lineLoginbutton,
  naver: naverLoginButton,
  wechat: wechatLoginButton,
  meta: metaLoginButton,
  none: null,
};

export type ButtonType = keyof typeof buttons;

export const getButton = (provider: ButtonType) => {
  const button = buttons[provider];
  if (!button) {
    throw new Error(`button ${provider} not found`);
  }
  return button;
};

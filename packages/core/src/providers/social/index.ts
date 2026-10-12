import GoogleAuthProvider from './googleAuth';
import AppleAuthProvider from './appleAuth';
import MetaAuthProvider, { FacebookAuthProvider } from './metaAuth';
import KakaoAuthProvider from './kakaoAuth';
import NaverAuthProvider from './naverAuth';
import LineAuthProvider from './lineAuth';

export const socialProviders = {
  google: GoogleAuthProvider,
  apple: AppleAuthProvider,
  meta: MetaAuthProvider,
  facebook: FacebookAuthProvider,
  kakao: KakaoAuthProvider,
  naver: NaverAuthProvider,
  line: LineAuthProvider,
};

export type SocialProviderType = keyof typeof socialProviders;

export {
  GoogleAuthProvider,
  AppleAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  LineAuthProvider,
};

export * from './googleAuth';
export * from './appleAuth';
export * from './metaAuth';
export * from './kakaoAuth';
export * from './naverAuth';
export * from './lineAuth';

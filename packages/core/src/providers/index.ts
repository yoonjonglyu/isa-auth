import GoogleAuthProvider from './googleAuth';
import KakaoAuthProvider from './kakaoAuth';
import NaverAuthProvider from './naverAuth';
import Web3AuthProvider from './web3Auth';
import type { AuthProvider } from './authProvider';

export const providers = {
  google: GoogleAuthProvider,
  kakao: KakaoAuthProvider,
  naver: NaverAuthProvider,
  web3: Web3AuthProvider,
  none: null,
};

export type ProviderType = keyof typeof providers;

export const getProvider = (provider: ProviderType) => {
  if (provider === 'none') {
    return null;
  }
  const Provider = providers[provider];
  if (!Provider) {
    throw new Error(`[ISA-AUTH] Provider "${provider}" is not registered`);
  }
  return Provider;
};

export {
  GoogleAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  Web3AuthProvider,
};

export type { AuthProvider };
export * from './pkce';
export * from './web3Auth';
export * from './kakaoAuth';
export * from './naverAuth';
export * from './googleAuth';

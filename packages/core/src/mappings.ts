import type { AuthServiceType } from './service';
import type { ButtonType } from './components';
import type { ProviderType } from './providers';

export type CoreProvicerType = Exclude<ProviderType | AuthServiceType, 'none'>;
// mappings.ts
export const providerToServiceMap: Record<CoreProvicerType, AuthServiceType> = {
  base: 'base',
  jwt: 'jwt',
  google: 'jwt',
  // kakao: 'jwt',
  // naver: 'jwt',
  // apple: 'jwt',
  // walletconnect: 'blockchain', // 향후 계획
};

export const providerToButtonMap: Record<CoreProvicerType, ButtonType> = {
  base: 'none',
  jwt: 'none',
  google: 'google',
  // kakao: 'kakao',
  // naver: 'naver',
  // apple: 'apple',
  // walletconnect: 'walletconnect',
};

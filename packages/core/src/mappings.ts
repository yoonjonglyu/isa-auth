import type { AuthServiceType } from './service';
import type { ButtonType } from './components';
import type { ProviderType } from './providers';

export type CoreProviderType = Exclude<ProviderType | AuthServiceType, 'none'>;

export const providerToServiceMap: Record<CoreProviderType, AuthServiceType> = {
  base: 'base',
  jwt: 'jwt',
  google: 'jwt',
  kakao: 'jwt',
  naver: 'jwt',
  web3: 'base',
  github: 'jwt',
  apple: 'jwt',
  discord: 'jwt',
  line: 'jwt',
  meta: 'jwt',
  facebook: 'jwt',
  world: 'base',
  passkey: 'base',
};

export const providerToButtonMap: Record<CoreProviderType, ButtonType> = {
  base: 'none',
  jwt: 'none',
  google: 'google',
  kakao: 'kakao',
  naver: 'naver',
  web3: 'web3',
  github: 'github',
  apple: 'apple',
  discord: 'discord',
  line: 'line',
  meta: 'meta',
  facebook: 'facebook',
  world: 'world',
  passkey: 'passkey',
};

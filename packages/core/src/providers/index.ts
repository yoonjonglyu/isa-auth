import {
  socialProviders,
  GoogleAuthProvider,
  AppleAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  LineAuthProvider,
} from './social';

import {
  developerProviders,
  GithubAuthProvider,
  DiscordAuthProvider,
} from './developer';

import {
  web3Providers,
  Web3AuthProvider,
} from './web3';

import {
  WorldAuthProvider,
  PasskeyAuthProvider,
} from './identity';

import type { AuthProvider } from './authProvider';

export const identityProviders = {
  world: WorldAuthProvider,
  passkey: PasskeyAuthProvider,
};

/**
 * Categorized Provider Modules
 */
export {
  socialProviders,
  developerProviders,
  web3Providers,
};

export type ProviderCategory = 'social' | 'developer' | 'web3' | 'identity';

/**
 * Unified Flat Providers Map
 */
export const providers = {
  // Social & Portals
  google: GoogleAuthProvider,
  apple: AppleAuthProvider,
  meta: MetaAuthProvider,
  facebook: FacebookAuthProvider,
  kakao: KakaoAuthProvider,
  naver: NaverAuthProvider,
  line: LineAuthProvider,

  // Developer & Community
  github: GithubAuthProvider,
  discord: DiscordAuthProvider,

  // Web3 & Crypto
  web3: Web3AuthProvider,

  // Identity & Biometrics / Proof of Personhood
  world: WorldAuthProvider,
  passkey: PasskeyAuthProvider,

  none: null,
};

export type ProviderType = keyof typeof providers;

/**
 * Mapping from each provider to its category
 */
export const providerCategoryMap: Record<Exclude<ProviderType, 'none'>, ProviderCategory> = {
  google: 'social',
  apple: 'social',
  meta: 'social',
  facebook: 'social',
  kakao: 'social',
  naver: 'social',
  line: 'social',
  github: 'developer',
  discord: 'developer',
  web3: 'web3',
  world: 'identity',
  passkey: 'identity',
};

/**
 * Returns the category of a provider
 */
export const getProviderCategory = (provider: ProviderType): ProviderCategory | null => {
  if (provider === 'none') return null;
  return providerCategoryMap[provider] || null;
};

/**
 * Returns all providers belonging to a specific category
 */
export const getProvidersByCategory = (category: ProviderCategory) => {
  switch (category) {
    case 'social':
      return socialProviders;
    case 'developer':
      return developerProviders;
    case 'web3':
      return web3Providers;
    case 'identity':
      return identityProviders;
    default:
      return {};
  }
};

/**
 * Gets a provider class by its identifier
 */
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
  AppleAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  LineAuthProvider,
  GithubAuthProvider,
  DiscordAuthProvider,
  Web3AuthProvider,
  WorldAuthProvider,
  PasskeyAuthProvider,
};

export type { AuthProvider };
export * from './authProvider';
export * from './pkce';
export * from './social';
export * from './developer';
export * from './web3';
export * from './identity';

import GoogleAuthProvider from './googleAuth';

const providers = {
  google: GoogleAuthProvider,
  none: null,
};
export type ProviderType = keyof typeof providers;

export const getProvider = (provider: ProviderType) => {
  const Provider = providers[provider];
  if (!Provider) {
    throw new Error(`Provider ${provider} not found`);
  }
  return Provider;
};

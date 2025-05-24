import GoogleAuthProvider from './googleAuth';

const providers = {
  google: GoogleAuthProvider,
  // Add other providers here}
};

export const getProvider = (provider: keyof typeof providers) => {
  const Provider = providers[provider];
  if (!Provider) {
    throw new Error(`Provider ${provider} not found`);
  }
  return Provider;
};

import Web3AuthProvider from './web3Auth';

export const web3Providers = {
  web3: Web3AuthProvider,
};

export type Web3ProviderType = keyof typeof web3Providers;

export {
  Web3AuthProvider,
};

export * from './web3Auth';

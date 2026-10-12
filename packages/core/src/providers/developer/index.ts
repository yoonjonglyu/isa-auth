import GithubAuthProvider from './githubAuth';
import DiscordAuthProvider from './discordAuth';

export const developerProviders = {
  github: GithubAuthProvider,
  discord: DiscordAuthProvider,
};

export type DeveloperProviderType = keyof typeof developerProviders;

export {
  GithubAuthProvider,
  DiscordAuthProvider,
};

export * from './githubAuth';
export * from './discordAuth';

export interface AuthProvider {
  init(): Promise<void>;
  signIn(): void;
  signOut(): void;
  getAccessToken(): Promise<string | null>;
  getUserInfo(): Promise<any>;
}

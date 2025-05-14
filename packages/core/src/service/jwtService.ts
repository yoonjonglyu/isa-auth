import { JwtManager } from '../auths/jwt/jwtManager';
import { setAuthState } from '../store/index';
import { TOKEN_KEY, REFRESH_KEY } from '../value';

const TOKEN_STORAGE = localStorage;

let jwtManager: JwtManager;

export function configureJwtManager(secret: string) {
  jwtManager = new JwtManager({ secret });
}

// localStorage에 토큰을 저장하는건 보안적으로 불리하니 엑세스는 store로 관리하고
// refresh는 httpOnly 쿠키로 관리하는게 좋다.
// refresh는 옵션이다보니 acessToken만으로도 로그인 유지가 되게 하는 기능이 필요한가는 조금 고민해볼 필요가 있음

export function loginWithToken(token: string, refreshToken?: string) {
  TOKEN_STORAGE.setItem(TOKEN_KEY, token);
  if (refreshToken) TOKEN_STORAGE.setItem(REFRESH_KEY, refreshToken);

  const decoded = jwtManager.decode(token);
  const expired =
    decoded && typeof decoded === 'object' && decoded.exp
      ? decoded.exp * 1000
      : Date.now() + 10 * 60 * 1000;

  setAuthState(Date.now() < expired);
}

export function logout() {
  TOKEN_STORAGE.removeItem(TOKEN_KEY);
  TOKEN_STORAGE.removeItem(REFRESH_KEY);
  setAuthState(false);
}

export function getAccessToken() {
  return TOKEN_STORAGE.getItem(TOKEN_KEY);
}

export function tryAutoRefresh(refresh: () => Promise<string>) {
  const token = getAccessToken();
  if (!token) return logout();

  try {
    jwtManager.verify(token);
    setAuthState(true);
  } catch {
    // Token expired → try refresh
    const refreshToken = TOKEN_STORAGE.getItem(REFRESH_KEY);
    if (!refreshToken) return logout();

    return refresh()
      .then((newToken) => loginWithToken(newToken, refreshToken))
      .catch(() => logout());
  }
}

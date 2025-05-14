import { JwtManager } from './jwtManager';

const ACCESS_TOKEN_KEY = 'isa-auth-token';
//** token을 기존 store에 어떤 구조로 통합할까? */
const jwt = new JwtManager({
  secret: 'isa-auth-secret',
  signOptions: { algorithm: 'HS256' },
  verifyOptions: { algorithms: ['HS256'] },
});

export function isValidToken(token: string): boolean {
  try {
    jwt.verify(token);
    return true;
  } catch {
    return false;
  }
}

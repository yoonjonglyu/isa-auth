import AuthBaseService from './baseAuthService';
import JwtService, { AutoRefreshOptions } from './jwtService';

const AuthService = {
  base: AuthBaseService,
  jwt: JwtService,
};

export type AuthServiceType = keyof typeof AuthService;

export const getAuthService = (serviceType: AuthServiceType) => {
  const Service = AuthService[serviceType];
  if (!Service) {
    throw new Error(`Auth service "${serviceType}" not found`);
  }
  return Service;
};

export {
  AuthBaseService,
  JwtService,
};

export type { AutoRefreshOptions };
export * from './baseAuthService';
export * from './jwtService';
export * from './tokenExchange';

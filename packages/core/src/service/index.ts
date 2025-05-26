import AuthBaseService from './baseAuthService';
import JwtService from './jwtService';

const AuthService = {
  base: AuthBaseService,
  jwt: JwtService,
};
export type AuthServiceType = keyof typeof AuthService;

export const getAuthService = (serviceType: AuthServiceType) => {
  const Service = AuthService[serviceType];
  if (!Service) {
    throw new Error(`Auth service ${serviceType} not found`);
  }
  return Service;
};

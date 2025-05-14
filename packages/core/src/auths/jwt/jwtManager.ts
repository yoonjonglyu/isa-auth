import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';

export interface JwtManagerOptions {
  secret: string;
  signOptions?: SignOptions;
  verifyOptions?: VerifyOptions;
}

export class JwtManager {
  private secret: string;
  private signOptions?: SignOptions;
  private verifyOptions?: VerifyOptions;

  constructor(options: JwtManagerOptions) {
    this.secret = options.secret;
    this.signOptions = options.signOptions;
    this.verifyOptions = options.verifyOptions;
  }

  sign(payload: string | Buffer | object, options?: SignOptions): string {
    return jwt.sign(payload, this.secret, { ...this.signOptions, ...options });
  }

  verify<T extends object = JwtPayload>(token: string, options?: VerifyOptions): T {
    return jwt.verify(token, this.secret, { ...this.verifyOptions, ...options }) as T;
  }

  decode(token: string): null | { [key: string]: any } | string {
    return jwt.decode(token);
  }
}
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // This tells Passport to look for the token in the "Authorization: Bearer" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Must match the exact string in your .env file
      secretOrKey:
        process.env.JWT_SECRET || 'ulads_super_secret_development_key_998877',
    });
  }

  // This method runs automatically when a valid token is decoded.
  // Whatever you return here gets attached to 'req.user' in your controller.
  async validate(payload: any) {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../../../generated/prisma/enums.js';

import { JWT_CONFIG } from '../../../common/constants/jwt.constants.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_CONFIG.SECRET,
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload) {
    return {
      user_id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

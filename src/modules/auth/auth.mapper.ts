import { Role } from '../../../generated/prisma/enums.js';

type AuthUser = {
  user_id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  password?: string | null;
};

export class AuthMapper {
  static toUserResponse(user: AuthUser) {
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  static toAuthResponse(message: string, token: string, user: AuthUser) {
    return {
      message,
      token,
      user: this.toUserResponse(user),
    };
  }
}

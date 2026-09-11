import { Role } from '../../../generated/prisma/enums.js';
import { serializeUser } from '../../common/utils/serialize-user.util.js';

export type UserResponse = {
  user_id: number;
  email: string;
  name: string | null;
  phone: string | null;
  profile_image: string | null;
  telegram_chat_id: string | null;
  role: Role;
  created_at: Date;
  updated_at: Date;
};

export type UserMapperInput = Omit<UserResponse, 'telegram_chat_id'> & {
  telegram_chat_id?: bigint | number | string | null;
  password?: string | null;
};

export class UserMapper {
  static toResponse(user: UserMapperInput): UserResponse {
    const safeUser = { ...user };
    delete safeUser.password;

    return serializeUser(safeUser);
  }

  static toResponses(users: UserMapperInput[]): UserResponse[] {
    return users.map((user) => this.toResponse(user));
  }
}

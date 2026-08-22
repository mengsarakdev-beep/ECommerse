export function serializeUser<
  T extends {
    telegram_chat_id?: bigint | number | string | null;
  },
>(
  user: T,
): Omit<T, 'telegram_chat_id'> & {
  telegram_chat_id: string | null;
} {
  return {
    ...user,
    telegram_chat_id:
      user.telegram_chat_id == null ? null : String(user.telegram_chat_id),
  };
}

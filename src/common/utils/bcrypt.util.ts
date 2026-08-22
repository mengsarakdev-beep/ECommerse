import { hash, compare } from 'bcrypt';
export async function hashPassword(
  password: string,
  saltRounds: number = 10,
): Promise<string> {
  return await hash(password, saltRounds);
}
// export       → file ផ្សេងអាច import
// async        → function ប្រើ asynchronous
// password     → password ដែលយើងផ្ញើចូល
// saltRounds   → bcrypt cost
// = 10         → default 10
// Promise      → លទ្ធផលត្រូវរង់ចាំ
// <string>     → លទ្ធផលចុងក្រោយជា String
// return hash() → បញ្ជូន hash ត្រឡប់

export async function comparePasswords(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

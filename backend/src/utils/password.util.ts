import bcrypt from 'bcrypt';

export class PasswordUtil {
  /**
   * Verify password against hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
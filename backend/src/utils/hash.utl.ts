import crypto from 'crypto';

export class HashUtil {
  /**
   * Hash IP address for privacy
   */
  static hashIp(ip: string | undefined): string {
    if (!ip) {
      return 'unknown';
    }

    const salt = process.env.IP_HASH_SALT || 'default-salt';
    
    return crypto
      .createHash('sha256')
      .update(ip + salt)
      .digest('hex')
      .substring(0, 32);
  }
}
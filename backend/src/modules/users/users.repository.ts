import { query } from '../../db';
import bcrypt from 'bcrypt';

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
    const rows = await query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<UserRow> {

  const passwordHash = await bcrypt.hash(input.password, 12);
  const rows = await query<UserRow>(
    `
    INSERT INTO users (email, password_hash, name)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [input.email, passwordHash, input.name ?? null],
  );
  return rows[0];
}

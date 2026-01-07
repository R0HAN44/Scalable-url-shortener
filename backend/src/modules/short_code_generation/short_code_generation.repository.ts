import { query } from '../../db';

export type ShortCodeRow = {
    id: number;
    next_id: number;
}

export async function reserveKeyRange(count: number): Promise<[number, number]> {
    const rows = await query(
        `UPDATE short_code_pool
         SET next_id = next_id + $1
         WHERE id = 1
         RETURNING next_id - $1 AS start, next_id AS end
         `,
        [count]
    );
    const row = rows[0];
    if (!row) {
        throw new Error("No available range");
    }
    return [row.start, row.end];
}
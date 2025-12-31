// scripts/migrate.ts
import { migrate } from 'postgres-migrations';
import { Client } from 'pg';
import path from 'node:path';

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        await migrate({ client }, path.join(__dirname, '../migrations'));
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

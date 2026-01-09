import { migrate } from 'postgres-migrations';
import { Client } from 'pg';
import path from 'path';
import 'dotenv/config';

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    try {
        await migrate(
            { client },
            path.join(__dirname, '../migrations')
        );
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});

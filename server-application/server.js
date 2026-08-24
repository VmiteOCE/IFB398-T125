import knex from 'knex';
import https from 'node:https';
import fs from 'node:fs';
import bcrypt from 'bcrypt';
import 'dotenv/config';

import knexConfig from './knexfile.js';
import { createApp } from './app.js';

const port = process.env.PORT || 3000;

// Initialize Knex
const db = knex(knexConfig);
const app = createApp(db);

async function initialieDatabase() {
    try {
        // Run migrations if they haven't been run yet
        await db.migrate.latest()

        console.log('Database migrations completed successfully.');

        // Check if any users exist in the table
        const users = await db('users').select('username');

        if (users.length === 0) {
            console.log('No users found. Creating default account...');

            const hashedPassword = await bcrypt.hash('admin', NUM_SALTS);

            await db('users').insert({
                username: 'admin',
                password: hashedPassword
            });

            console.log('Default user created...');
            console.log('Username: "admin"');
            console.log('Password: "admin"');
        }
    } catch (error) {
        console.log('Failed to run database migrations:', error);
        throw error;
    }
}

async function startServer() {
    try {
        await initialieDatabase();

        // HTTPS Credentials
        const credentials = {
            key: fs.readFileSync('./certs/selfsigned.key'),
            cert: fs.readFileSync('./certs/selfsigned.crt')
        }

        // Start HTTPS server
        https.createServer(credentials, app).listen(port, () => {
            console.log(`Server listening on https://localhost:${port}`);
        });

    } catch (error) {
        if (error.code == 'ENOENT') {
            console.error("HTTPS Initialization Error: Could not read certificate keys.");
            console.error("Please press \"CTRL + C\" and run \"npm run cert\" to generate local credentials.");
        } else {
            console.error('Server startup failed:', error);
        }

        process.exit(1);
    }
}

startServer();

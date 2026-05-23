import express from 'express';
import knex from 'knex';
import cors from 'cors';
import morgan from 'morgan';
import knexConfig from './knexfile.js';
import https from 'node:https';
import fs from 'node:fs';
import 'dotenv/config';
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/openapi.json' with { type: 'json' };

import gamesRouter from './routes/games.js';
import eventsRouter from './routes/events.js';
import userRouter from './routes/user.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize Knex
const db = knex(knexConfig);

// Run migrations if they haven't been run yet
db.migrate.latest()
  .then(async () => {
    console.log('Database migrations completed successfully.');

    // Check if any users exist in the table
    const users = await db('users').select('username');

    if (users.length === 0) {
      console.log('No users found. Creating default account...');

      await db('users').insert({
        username: 'admin',
        password: 'admin'
      });

      console.log('Default user created...');
      console.log('Username: "admin"');
      console.log('Password: "admin"');
    }
  })
  .catch((err) => {
    console.error('Failed to run database migrations:', err);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// Inject Knex instance into req.db so routers can access without importing
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Serve documentation at server root
app.use('/', swaggerUI.serve);
app.get('/', swaggerUI.setup(swaggerDocument));

// Mount routers
// https://localhost:3000/games
// ./routes/games.js
app.use('/games', gamesRouter);

// https://localhost:3000/events
// ./routes/events.js
app.use('/events', eventsRouter);

// https://localhost:3000/user
// ./routes/user.js
app.use('/user', userRouter);

// Attempt to start HTTPS server instance
try {
  const credentials = {
    key: fs.readFileSync('./certs/selfsigned.key'),
    cert: fs.readFileSync('./certs/selfsigned.crt')
  };

  https.createServer(credentials, app).listen(port, () => {
    console.log(`Server listening on https://localhost:${port}`);
  });

} catch (error) {
  console.error("HTTPS Initialization Error: Could not read certificate keys.");
  console.error("Please press \"CTRL + C\" and run \"npm run cert\" to generate local credentials.");
  process.exit(1);
}

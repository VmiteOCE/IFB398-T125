import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/openapi.json' with { type: 'json' };

import gamesRouter from './routes/games.js';
import eventsRouter from './routes/events.js';
import userRouter from './routes/user.js';

export function createApp(db) {
  const app = express();

  // Swagger configuration
  const swaggerOptions = {
    swaggerOptions: {
      defaultModelsExpandDepth: 0, // 0 = Collapsed, -1 = Hidden
      docExpansion: 'list'
    }
  };

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Inject Knex instance into req.db so routers can access without importing
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

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

    // Serve documentation at server root
    app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument, swaggerOptions));

    return app;
}





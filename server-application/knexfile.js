import 'dotenv/config';

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data.sqlite3'
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => conn.run('PRAGMA foreign_keys = ON', cb)
    },
    migrations: {
      directory: './knex-migrations'
    },
    seeds: {
      directory: './knex-seeds'
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './knex-migrations'
    },
    seeds: {
      directory: './knex-seeds'
    }
  }
};
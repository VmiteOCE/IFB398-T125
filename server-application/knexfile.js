export default {
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
};

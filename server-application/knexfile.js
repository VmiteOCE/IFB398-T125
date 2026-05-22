export default {
  client: 'sqlite3',
  connection: {
    filename: './data.sqlite3'
  },
  useNullAsDefault: true,
  migrations: {
    directory: './knex-migrations'
  },
  seeds: {
    directory: './knex-seeds'
  }
};

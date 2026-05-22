export function up(knex) {
  return knex.schema
    .createTable('games', (table) => {
      table.increments('game_id').primary();
      table.string('game_name').notNullable();
      table.string('vs_team').notNullable();
      table.integer('start_time').notNullable();
      table.string('game_status').notNullable().defaultTo('scheduled');
    })
    .createTable('events', (table) => {
      table.increments('event_id').primary();
      table.integer('game_id').references('game_id').inTable('games').onDelete('CASCADE');
      table.string('event_code', 1).notNullable();
      table.string('zone_id', 1).notNullable();
      table.integer('team_id').notNullable();
      table.integer('game_clock').notNullable();
      table.integer('game_half').notNullable().defaultTo(1);
    })
    .createTable('users', (table) => {
      table.string('username').primary();
      table.string('password').notNullable();
    });
}

export function down(knex) {
  // Drop tables in reverse order to respect foreign key constraints
  return knex.schema
    .dropTableIfExists('users')
    .dropTableIfExists('events')
    .dropTableIfExists('games')
}

export async function seed(knex) {
  // Wipe tables in reverse order to respect foreign key constraints
  await knex('users').del();
  await knex('events').del();
  await knex('games').del();

  // Add default user
  await knex('users').insert([
    { username: 'admin', password: 'admin' }
  ]);

  // ===========================================================================
  // DATE FORMATTING DETAILS
  // ===========================================================================
  // Always convert JS Date objects using .toISOString() before sending in
  // POST/PUT request bodies. The DB stores them as integer values for sorting.
  // Example Conversion: new Date().toISOString() -> "2026-05-23T11:15:09.000Z"
  // ===========================================================================
  const sampleDates = [
    new Date('2026-05-25T14:30:00Z').toISOString(), // Week 12 Game
    new Date('2026-06-01T18:00:00Z').toISOString()  // Practice Game
  ];

  // Add test games and capture auto-increment id values
  // SQLite returns an array of the inserted ids: [ id1, id2 ]
  const [game1id, game2id] = await knex('games').insert([
    { game_name: 'Season 2026 - Week 12', vs_team: 'Waratahs', start_time: sampleDates[0], game_status: 'completed' },
    { game_name: 'Practice Game vs Storm', vs_team: 'Storm', start_time: sampleDates[1], game_status: 'scheduled' }
  ]);

  // Add test events using captured auto-increment id values
  await knex('events').insert([
    { game_id: game1id, event_code: 'P', zone_id: 'M', team_id: 1, game_clock: 10, game_half: 1 },
    { game_id: game1id, event_code: 'C', zone_id: 'B', team_id: 1, game_clock: 70, game_half: 1 },
    { game_id: game1id, event_code: 'K', zone_id: 'A', team_id: 1, game_clock: 130, game_half: 1 },
    { game_id: game1id, event_code: 'T', zone_id: 'A', team_id: 1, game_clock: 610, game_half: 1 },
    { game_id: game2id, event_code: 'P', zone_id: 'M', team_id: 2, game_clock: 10, game_half: 1 },
    { game_id: game2id, event_code: 'C', zone_id: 'C', team_id: 2, game_clock: 70, game_half: 1 },
    { game_id: game2id, event_code: 'K', zone_id: 'D', team_id: 2, game_clock: 130, game_half: 1 },
    { game_id: game2id, event_code: 'T', zone_id: 'D', team_id: 2, game_clock: 610, game_half: 1 }
  ]);
}

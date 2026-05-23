export async function seed(knex) {
  // Wipe tables
  await knex('users').del();
  await knex('events').del();
  await knex('games').del();

  // Add default user
  await knex('users').insert([
    { username: 'admin', password: 'admin' }
  ]);

  // Add test games
  const [game1, game2] = await knex('games').insert([
    { game_name: 'Season 2026 - Week 12', vs_team: 'Waratahs', start_time: 1779514200000, game_status: 'completed' },
    { game_name: 'Practice Game vs Storm', vs_team: 'Storm', start_time: 1780120800000, game_status: 'scheduled' }
  ]).returning('game_id'); 
  // Use .returning() to capture auto-increment game ids

  // Add test events
  await knex('events').insert([
    { game_id: game1.game_id, event_code: 'P', zone_id: 'M', team_id: 1, game_clock: 10, game_half: 1 },
    { game_id: game1.game_id, event_code: 'C', zone_id: 'B', team_id: 1, game_clock: 70, game_half: 1 },
    { game_id: game1.game_id, event_code: 'K', zone_id: 'A', team_id: 1, game_clock: 130, game_half: 1 },
    { game_id: game1.game_id, event_code: 'T', zone_id: 'A', team_id: 1, game_clock: 610, game_half: 1 },
    { game_id: game2.game_id, event_code: 'P', zone_id: 'M', team_id: 2, game_clock: 10, game_half: 1 },
    { game_id: game2.game_id, event_code: 'C', zone_id: 'C', team_id: 2, game_clock: 70, game_half: 1 },
    { game_id: game2.game_id, event_code: 'K', zone_id: 'D', team_id: 2, game_clock: 130, game_half: 1 },
    { game_id: game2.game_id, event_code: 'T', zone_id: 'D', team_id: 2, game_clock: 610, game_half: 1 }
  ]);
}

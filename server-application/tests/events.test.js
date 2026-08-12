import { beforeAll, beforeEach, afterAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import knex from 'knex';

import { createApp } from '../app.js';

let db;
let app;

// =========================================================
// Test Setup
// =========================================================

beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    // Create a completely separate in-memory SQLite database
    db = knex({
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true,
        migrations: { directory: './knex-migrations' }
    });

    // Build the database using the real project migrations
    await db.migrate.latest();

    // Create Express app using the test database
    app = createApp(db);
});

beforeEach(async () => {
    await db('events').del();
    await db('games').del();
});

afterAll(async () => {
    // Properly close the Knex database connection
    await db.destroy();
});


// =========================================================
// POST /games
// =========================================================

describe('POST /games', () => {

    test('creates a new game', async () => {
        const newGame = {
            game_name: 'New Test Game',
            vs_team: 'Brisbane Test Team',
            start_time: '2026-09-10T19:00',
            game_status: 'scheduled'
        };

        const response = await request(app)
            .post('/games')
            .send(newGame);

        expect(response.status).toBe(201);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Game created successfully'
        });

        expect(response.body.game_id).toBeDefined();

        // Verify it was actually written to SQLite
        const savedGame = await db('games').where('game_id', response.body.game_id).first();

        expect(savedGame).toMatchObject(newGame);
    });

});


// =========================================================
// GET /games
// =========================================================

describe('GET /games', () => {

    test('returns games from the database', async () => {
        await db('games').insert({
            game_name: 'Test Game',
            vs_team: 'Test Opponent',
            start_time: '2026-08-20T18:30',
            game_status: 'scheduled'
        });

        const response = await request(app).get('/games');

        expect(response.status).toBe(200);
        expect(response.body.error).toBe(false);
        expect(response.body.games).toHaveLength(1);

        expect(response.body.games[0]).toMatchObject({
            game_name: 'Test Game',
            vs_team: 'Test Opponent',
            start_time: '2026-08-20T18:30',
            game_status: 'scheduled'
        });

        expect(response.body.pagination.total).toBe(1);
    });


    test('returns an empty array when no games exist', async () => {
        const response = await request(app)
            .get('/games');

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Success'
        });

        expect(response.body.games).toEqual([]);
        expect(response.body.pagination.total).toBe(0);
    });

});


// =========================================================
// GET /games - Search, Filters, Sorting and Pagination
// =========================================================

describe('GET /games filters', () => {

    beforeEach(async () => {
        await db('games').insert([
            {
                game_name: 'Reds vs Storm',
                vs_team: 'Storm',
                start_time: '2026-08-10T18:00',
                game_status: 'scheduled'
            },
            {
                game_name: 'Practice Match',
                vs_team: 'Broncos',
                start_time: '2026-08-15T19:00',
                game_status: 'in_progress'
            },
            {
                game_name: 'Final Game',
                vs_team: 'Storm',
                start_time: '2026-08-20T20:00',
                game_status: 'completed'
            }
        ]);
    });


    test('searches game name and opponent', async () => {
        const response = await request(app).get('/games?search=Storm');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(2);

        expect(
            response.body.games.every(
                (game) =>
                    game.game_name.includes('Storm') ||
                    game.vs_team.includes('Storm')
            )
        ).toBe(true);
    });


    test('filters by status', async () => {
        const response = await request(app).get('/games?status=in_progress');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(1);

        expect(response.body.games[0]).toMatchObject({
            game_name: 'Practice Match',
            game_status: 'in_progress'
        });
    });


    test('filters games on or after the start date', async () => {
        const response = await request(app).get('/games?start=2026-08-15T00:00');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(2);

        expect(response.body.games.map((game) => game.game_name)).toEqual(['Practice Match', 'Final Game']);
    });


    test('filters games between start and end dates', async () => {
        const response = await request(app).get('/games?start=2026-08-11T00:00&end=2026-08-19T23:59');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(1);

        expect(response.body.games[0]).toMatchObject({
            game_name: 'Practice Match',
            start_time: '2026-08-15T19:00'
        });
    });


    test('sorts games by start time ascending', async () => {
        const response = await request(app).get('/games?sortBy=start_time&sortOrder=asc');

        expect(response.status).toBe(200);
        expect(response.body.games.map((game) => game.game_name)).toEqual(['Reds vs Storm', 'Practice Match', 'Final Game']);
    });


    test('sorts games by start time descending', async () => {
        const response = await request(app).get('/games?sortBy=start_time&sortOrder=desc');

        expect(response.status).toBe(200);
        expect(response.body.games.map((game) => game.game_name)).toEqual(['Final Game', 'Practice Match', 'Reds vs Storm']);
    });


    test('returns the requested page and limit', async () => {
        const response = await request(app).get('/games?page=1&limit=2&sortBy=start_time&sortOrder=asc');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(2);
        expect(response.body.games.map((game) => game.game_name)).toEqual(['Reds vs Storm', 'Practice Match']);

        expect(response.body.pagination).toMatchObject({
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2,
            nextPage: 2,
            previousPage: null
        });
    });


    test('returns the second page correctly', async () => {
        const response = await request(app).get('/games?page=2&limit=2&sortBy=start_time&sortOrder=asc');

        expect(response.status).toBe(200);
        expect(response.body.games).toHaveLength(1);

        expect(response.body.games[0]).toMatchObject({
            game_name: 'Final Game'
        });

        expect(response.body.pagination).toMatchObject({
            page: 2,
            limit: 2,
            total: 3,
            totalPages: 2,
            nextPage: null,
            previousPage: 1
        });
    });

});


// =========================================================
// GET /games/:id
// =========================================================

describe('GET /games/:id', () => {

    test('returns the requested game', async () => {
        const [gameId] = await db('games').insert({
            game_name: 'Specific Game',
            vs_team: 'Specific Opponent',
            start_time: '2026-09-15T18:00',
            game_status: 'scheduled'
        });

        const response = await request(app).get(`/games/${gameId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Success'
        });

        expect(response.body.game).toMatchObject({
            game_id: gameId,
            game_name: 'Specific Game',
            vs_team: 'Specific Opponent',
            start_time: '2026-09-15T18:00',
            game_status: 'scheduled'
        });
    });


    test('returns 404 when game does not exist', async () => {
        const response = await request(app).get('/games/999999');

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Game not found'
        });
    });

});


// =========================================================
// PUT /games/:id
// =========================================================

describe('PUT /games/:id', () => {

    test('updates an existing game', async () => {
        const [gameId] = await db('games').insert({
            game_name: 'Original Game',
            vs_team: 'Original Opponent',
            start_time: '2026-09-15T18:00',
            game_status: 'scheduled'
        });

        const updatedGame = {
            game_name: 'Updated Game',
            vs_team: 'Updated Opponent',
            start_time: '2026-09-20T19:30',
            game_status: 'in_progress'
        };

        const response = await request(app).put(`/games/${gameId}`).send(updatedGame);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Game updated successfully'
        });

        expect(response.body.game_id).toBe(gameId);

        // Verify the database was actually updated
        const savedGame = await db('games').where('game_id', gameId).first();

        expect(savedGame).toMatchObject({
            game_id: gameId,
            ...updatedGame
        });
    });


    test('returns 404 when updating a game that does not exist', async () => {
        const response = await request(app)
            .put('/games/999999')
            .send({
                game_name: 'Missing Game',
                vs_team: 'Missing Opponent',
                start_time: '2026-09-20T19:30',
                game_status: 'scheduled'
            });

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Game not found'
        });
    });

});


// =========================================================
// DELETE /games/:id
// =========================================================

describe('DELETE /games/:id', () => {

    test('deletes an existing game', async () => {
        const [gameId] = await db('games').insert({
            game_name: 'Game To Delete',
            vs_team: 'Delete Opponent',
            start_time: '2026-09-25T18:00',
            game_status: 'scheduled'
        });

        const response = await request(app).delete(`/games/${gameId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Game deleted successfully',
            game_id: gameId
        });

        // Verify it was actually removed from SQLite
        const deletedGame = await db('games').where('game_id', gameId).first();

        expect(deletedGame).toBeUndefined();
    });


    test('returns 404 when deleting a game that does not exist', async () => {
        const response = await request(app).delete('/games/999999');

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Game not found'
        });
    });

});
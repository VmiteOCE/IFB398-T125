import { beforeAll, beforeEach, afterAll, describe, expect, test} from 'vitest';
import request from 'supertest';
import knex from 'knex';
import bcrypt from "bcrypt";

import { createApp } from '../app.js';

let db;
let app;
let agent;
let gameId;

// =========================================================
// Test Setup
// =========================================================

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';

    // Create a completely separate in-memory SQLite database
    db = knex({
        client: 'sqlite3',
        connection: { filename: ':memory:' },
        useNullAsDefault: true,
        pool: { afterCreate: (connection, done) => {
            connection.run('PRAGMA foreign_keys = ON', done);
        }},
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
    await db('users').del();

    const hashedPassword = await bcrypt.hash("testpassword", 10);

    await db('users').insert({
        username: 'testuser',
        password: hashedPassword,
        role: 'admin'
    });

    [gameId] = await db('games').insert({
        game_name: 'Test Game',
        vs_team: 'Test Opponent',
        start_time: '2026-08-20T18:30',
        game_status: 'scheduled'
    });

    agent = request.agent(app);

    const loginResponse = await agent
        .post("/user/login")
        .send({
            username: "testuser",
            password: "testpassword"
        });

    expect(loginResponse.status).toBe(200);
});

afterAll(async () => {
    // Properly close the Knex database connection
    await db.destroy();
});


// =========================================================
// POST /events
// =========================================================

describe('POST /events', () => {

    test('creates a new event', async () => {
        const newEvent = {
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        };

        const response = await agent
            .post('/events')
            .send(newEvent);

        expect(response.status).toBe(201);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Event logged successfully'
        });

        expect(response.body.event_id).toBeDefined();

        const savedEvent = await db('events')
            .where('event_id', response.body.event_id)
            .first();

        expect(savedEvent).toMatchObject(newEvent);
    });


    test('returns 400 when game_id is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: 0,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'A valid game ID is required.'
        });
    });


    test('returns 400 when event_code is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: gameId,
                event_code: 'INVALID',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid event code.'
        });
    });


    test('returns 400 when zone_id is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: gameId,
                event_code: 'R',
                zone_id: 'Z',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid zone.'
        });
    });


    test('returns 400 when team_id is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 3,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid team ID.'
        });
    });


    test('returns 400 when game_clock is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: -1,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'A valid game clock is required.'
        });
    });


    test('returns 400 when game_half is invalid', async () => {
        const response = await agent
            .post('/events')
            .send({
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 3
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid game half.'
        });
    });

});


// =========================================================
// GET /events/game/:id
// =========================================================

describe('GET /events/game/:id', () => {

    test('returns all events for the requested game', async () => {
        await db('events').insert([
            {
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            },
            {
                game_id: gameId,
                event_code: 'K',
                zone_id: 'A',
                team_id: 2,
                game_clock: 60,
                game_half: 1
            }
        ]);

        const response = await agent.get(`/events/game/${gameId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Success'
        });

        expect(response.body.events).toHaveLength(2);
    });


    test('sorts events by game_clock ascending', async () => {
        await db('events').insert([
            {
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: 300,
                game_half: 1
            },
            {
                game_id: gameId,
                event_code: 'K',
                zone_id: 'A',
                team_id: 2,
                game_clock: 60,
                game_half: 1
            },
            {
                game_id: gameId,
                event_code: 'P',
                zone_id: 'B',
                team_id: 1,
                game_clock: 180,
                game_half: 1
            }
        ]);

        const response = await agent.get(`/events/game/${gameId}`);

        expect(response.status).toBe(200);
        expect(response.body.events.map((event) => event.game_clock)).toEqual([60, 180, 300]);
    });


    test('returns an empty array when game has no events', async () => {
        const response = await agent.get(`/events/game/${gameId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Success'
        });

        expect(response.body.events).toEqual([]);
    });


    test('returns 404 when game does not exist', async () => {
        const response = await agent.get('/events/game/999999');

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Game not found'
        });
    });

});


// =========================================================
// GET /events/:id
// =========================================================

describe('GET /events/:id', () => {

    test('returns the requested event', async () => {
        const [eventId] = await db('events').insert({
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        });

        const response = await agent.get(`/events/${eventId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Success'
        });

        expect(response.body.event).toMatchObject({
            event_id: eventId,
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        });
    });


    test('returns 404 when event does not exist', async () => {
        const response = await agent.get('/events/999999');

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Event not found'
        });
    });

});


// =========================================================
// PUT /events/:id
// =========================================================

describe('PUT /events/:id', () => {

    test('updates an existing event', async () => {
        const [eventId] = await db('events').insert({
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        });

        const updatedEvent = {
            game_id: gameId,
            event_code: 'K',
            zone_id: 'A',
            team_id: 2,
            game_clock: 240,
            game_half: 1
        };

        const response = await agent
            .put(`/events/${eventId}`)
            .send(updatedEvent);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Event updated successfully'
        });

        const savedEvent = await db('events')
            .where('event_id', eventId)
            .first();

        expect(savedEvent).toMatchObject({
            event_id: eventId,
            ...updatedEvent
        });
    });


    test('returns 400 when updating with invalid event data', async () => {
        const [eventId] = await db('events').insert({
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        });

        const response = await agent
            .put(`/events/${eventId}`)
            .send({
                game_id: gameId,
                event_code: 'INVALID',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid event code.'
        });
    });


    test('returns 404 when updating an event that does not exist', async () => {
        const response = await agent
            .put('/events/999999')
            .send({
                game_id: gameId,
                event_code: 'R',
                zone_id: 'M',
                team_id: 1,
                game_clock: 120,
                game_half: 1
            });

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Event not found'
        });
    });

});


// =========================================================
// DELETE /events/:id
// =========================================================

describe('DELETE /events/:id', () => {

    test('deletes an existing event', async () => {
        const [eventId] = await db('events').insert({
            game_id: gameId,
            event_code: 'R',
            zone_id: 'M',
            team_id: 1,
            game_clock: 120,
            game_half: 1
        });

        const response = await agent.delete(`/events/${eventId}`);

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Event deleted successfully'
        });

        const deletedEvent = await db('events')
            .where('event_id', eventId)
            .first();

        expect(deletedEvent).toBeUndefined();
    });


    test('returns 404 when deleting an event that does not exist', async () => {
        const response = await agent
            .delete('/events/999999');

        expect(response.status).toBe(404);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Event not found'
        });
    });

});
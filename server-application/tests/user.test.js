import { beforeAll, beforeEach, afterAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import knex from 'knex';
import bcrypt from "bcrypt";

import { createApp } from '../app.js';

let db;
let app;
let agent;

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
    // Reset users before every test
    await db('users').del();

    const hashedPassword = await bcrypt.hash("testpassword", 10);

    await db("users").insert({
        username: "testuser",
        password: hashedPassword,
        role: "admin"
    });

    // Authenticate
    agent = request.agent(app);

    await agent
        .post("/user/login")
        .send({
            username: "testuser",
            password: "testpassword"
        });
});

afterAll(async () => {
    // Properly close the Knex database connection
    await db.destroy();
});


// =========================================================
// POST /user/login
// =========================================================

describe('POST /user/login', () => {

    test('logs in with valid credentials', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            error: false,
            message: 'Login successful'
        });
    });


    test('sets authentication cookie after successful login', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });

        expect(response.status).toBe(200);

        const cookies = response.headers['set-cookie'];

        expect(cookies).toBeDefined();
        expect(cookies[0]).toContain('token=');
        expect(cookies[0]).toContain('HttpOnly');
    });


    test('returns 400 when username is missing', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                password: 'testpassword'
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Please provide both a username and password.'
        });
    });


    test('returns 400 when password is missing', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser'
            });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Please provide both a username and password.'
        });
    });


    test('returns 400 when both username and password are missing', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({});

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Please provide both a username and password.'
        });
    });


    test('returns 401 when username does not exist', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'unknownuser',
                password: 'testpassword'
            });

        expect(response.status).toBe(401);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid username or password'
        });
    });


    test('returns 401 when password is incorrect', async () => {
        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid username or password'
        });
    });


    test('does not authenticate another user password against testuser', async () => {
        await db('users').insert({
            username: 'seconduser',
            password: 'secondpassword'
        });

        const response = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'secondpassword'
            });

        expect(response.status).toBe(401);

        expect(response.body).toMatchObject({
            error: true,
            message: 'Invalid username or password'
        });
    });

});
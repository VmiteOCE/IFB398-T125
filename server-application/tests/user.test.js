import { beforeAll, beforeEach, afterAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import knex from 'knex';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

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
    // Reset users and role permissions before every test
    await db('users').del();
    await db('role_permissions').del();

    const hashedPassword = await bcrypt.hash("testpassword", 10);

    await db("users").insert({
        username: "testuser",
        password: hashedPassword,
        role: "admin"
    });

    await db("role_permissions").insert([
        { role: "admin", match_access: "edit" },
        { role: "analyst", match_access: "edit" },
        { role: "coach", match_access: "view" },
        { role: "viewer", match_access: "none" }
    ]);

    // Authenticate
    agent = request.agent(app);

    await agent
        .post("/user/login")
        .send({
            username: "testuser",
            password: "testpassword",
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

// =========================================================
// GET /user/verify
// =========================================================

describe('GET /user/verify', () => {

    test('verifies a valid authenticated session', async () => {
        const response = await agent.get('/user/verify');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            error: false,
            message: 'Token is valid!'
        });
        expect(response.body.token).toMatchObject({
            username: 'testuser',
            role: 'admin'
        });
    });

    test('returns 401 when authentication token is missing', async () => {
        const response = await request(app).get('/user/verify');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication token missing');
    });

    test('returns 401 when authentication token is invalid', async () => {
        const response = await request(app)
            .get('/user/verify')
            .set('Cookie', 'token=invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or expired token');
    });

    test('returns 401 when authentication token is expired', async () => {
        const token = jwt.sign(
            { username: 'testuser', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: -1 }
        );

        const response = await request(app)
            .get('/user/verify')
            .set('Cookie', `token=${token}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or expired token');
    });
});


// =========================================================
// User Management - Create
// =========================================================

describe('POST /user', () => {

    test('creates a new user', async () => {
        const response = await agent
            .post('/user')
            .send({ username: 'newuser', password: 'newpassword', role: 'analyst' });

        expect(response.status).toBe(201);
        expect(response.body.error).toBe(false);

        const saved = await db('users').where('username', 'newuser').first();
        expect(saved).toBeDefined();
        expect(saved.role).toBe('analyst');
        expect(saved.password).not.toBe('newpassword');
        expect(await bcrypt.compare('newpassword', saved.password)).toBe(true);
    });

    test('returns 400 when required fields are missing', async () => {
        const response = await agent
            .post('/user')
            .send({ username: 'newuser', role: 'viewer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Please provide 'username', 'password', and 'role'.");
    });

    test('returns 409 when username already exists', async () => {
        const response = await agent
            .post('/user')
            .send({ username: 'testuser', password: 'newpassword', role: 'viewer' });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Username already exists.');
    });

    test('returns 400 for an invalid role', async () => {
        const response = await agent
            .post('/user')
            .send({ username: 'newuser', password: 'newpassword', role: 'owner' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid role.');
    });

    test('returns 401 when unauthenticated', async () => {
        const response = await request(app)
            .post('/user')
            .send({ username: 'newuser', password: 'newpassword', role: 'viewer' });

        expect(response.status).toBe(401);
    });
});


// =========================================================
// User Management - Read
// =========================================================

describe('GET /user', () => {

    test('returns users without exposing password hashes', async () => {
        await db('users').insert({
            username: 'vieweruser',
            password: await bcrypt.hash('viewerpass', 10),
            role: 'viewer'
        });

        const response = await agent.get('/user');

        expect(response.status).toBe(200);
        expect(response.body.error).toBe(false);
        expect(response.body.users).toEqual(expect.arrayContaining([
            { username: 'testuser', role: 'admin' },
            { username: 'vieweruser', role: 'viewer' }
        ]));
        expect(JSON.stringify(response.body.users)).not.toContain('password');
    });

    test('returns 401 when unauthenticated', async () => {
        const response = await request(app).get('/user');
        expect(response.status).toBe(401);
    });
});


// =========================================================
// User Management - Update
// =========================================================

describe('PATCH /user', () => {

    beforeEach(async () => {
        await db('users').insert({
            username: 'edituser',
            password: await bcrypt.hash('oldpassword', 10),
            role: 'viewer'
        });
    });

    test('updates a users role', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'edituser', role: 'analyst' });

        expect(response.status).toBe(200);
        const user = await db('users').where('username', 'edituser').first();
        expect(user.role).toBe('analyst');
    });

    test('updates a users password', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'edituser', password: 'newpassword' });

        expect(response.status).toBe(200);
        const user = await db('users').where('username', 'edituser').first();
        expect(await bcrypt.compare('newpassword', user.password)).toBe(true);
        expect(await bcrypt.compare('oldpassword', user.password)).toBe(false);
    });

    test('updates both role and password', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'edituser', role: 'coach', password: 'newpassword' });

        expect(response.status).toBe(200);
        const user = await db('users').where('username', 'edituser').first();
        expect(user.role).toBe('coach');
        expect(await bcrypt.compare('newpassword', user.password)).toBe(true);
    });

    test('returns 400 when neither role nor password is provided', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'edituser' });

        expect(response.status).toBe(400);
    });

    test('returns 400 for an invalid role', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'edituser', role: 'owner' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid role.');
    });

    test('prevents an admin from modifying their own account', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'testuser', role: 'viewer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('cannot modify your own');
    });

    test('returns 404 for a nonexistent user', async () => {
        const response = await agent
            .patch('/user')
            .send({ username: 'missinguser', role: 'viewer' });

        expect(response.status).toBe(404);
    });
});


// =========================================================
// User Management - Delete
// =========================================================

describe('DELETE /user', () => {

    beforeEach(async () => {
        await db('users').insert({
            username: 'deleteuser',
            password: await bcrypt.hash('password', 10),
            role: 'viewer'
        });
    });

    test('deletes another user', async () => {
        const response = await agent
            .delete('/user')
            .send({ username: 'deleteuser' });

        expect(response.status).toBe(200);
        expect(await db('users').where('username', 'deleteuser').first()).toBeUndefined();
    });

    test('prevents an admin from deleting their own account', async () => {
        const response = await agent
            .delete('/user')
            .send({ username: 'testuser' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('cannot delete your own');
    });

    test('returns 404 for a nonexistent user', async () => {
        const response = await agent
            .delete('/user')
            .send({ username: 'missinguser' });

        expect(response.status).toBe(404);
    });
});


// =========================================================
// PUT /user/password
// =========================================================

describe('PUT /user/password', () => {

    test('updates the logged in users password', async () => {
        const response = await agent
            .put('/user/password')
            .send({ current_password: 'testpassword', new_password: 'newpassword' });

        expect(response.status).toBe(200);

        const user = await db('users').where('username', 'testuser').first();
        expect(await bcrypt.compare('newpassword', user.password)).toBe(true);
    });

    test('returns 401 when the current password is incorrect', async () => {
        const response = await agent
            .put('/user/password')
            .send({ current_password: 'wrongpassword', new_password: 'newpassword' });

        expect(response.status).toBe(401);
    });

    test('returns 400 when password fields are missing', async () => {
        const response = await agent
            .put('/user/password')
            .send({ current_password: 'testpassword' });

        expect(response.status).toBe(400);
    });

    test('returns 401 when unauthenticated', async () => {
        const response = await request(app)
            .put('/user/password')
            .send({ current_password: 'testpassword', new_password: 'newpassword' });

        expect(response.status).toBe(401);
    });
});


// =========================================================
// User Keybinds
// =========================================================

describe('User keybinds', () => {

    test('returns null when no keybinds are saved', async () => {
        const response = await agent.get('/user/keybinds');

        expect(response.status).toBe(200);
        expect(response.body.keybinds).toBeNull();
    });

    test('saves and returns keybinds', async () => {
        const keybinds = { Move_Zone_Left: 'a', Move_Zone_Right: 'd' };
        const response = await agent.put('/user/keybinds').send(keybinds);

        expect(response.status).toBe(200);
        expect(response.body.keybinds).toEqual(keybinds);

        const saved = await agent.get('/user/keybinds');
        expect(saved.body.keybinds).toEqual(keybinds);
    });

    test('rejects an empty keybind object', async () => {
        const response = await agent.put('/user/keybinds').send({});
        expect(response.status).toBe(400);
    });

    test('rejects non-string keybind values', async () => {
        const response = await agent
            .put('/user/keybinds')
            .send({ Move_Zone_Left: 1 });

        expect(response.status).toBe(400);
    });

    test('resets keybinds', async () => {
        await agent.put('/user/keybinds').send({ Move_Zone_Left: 'a' });
        const response = await agent.delete('/user/keybinds');

        expect(response.status).toBe(200);
        expect(response.body.keybinds).toBeNull();
    });
});


// =========================================================
// User Settings
// =========================================================

describe('User settings', () => {

    test('returns null when no settings are saved', async () => {
        const response = await agent.get('/user/settings');

        expect(response.status).toBe(200);
        expect(response.body.settings).toBeNull();
    });

    test('saves and returns settings', async () => {
        const settings = { Enable_Keybinds: true, Outline_Colour: 'Green' };
        const response = await agent.put('/user/settings').send(settings);

        expect(response.status).toBe(200);
        expect(response.body.settings).toEqual(settings);

        const saved = await agent.get('/user/settings');
        expect(saved.body.settings).toEqual(settings);
    });

    test('rejects an empty settings object', async () => {
        const response = await agent.put('/user/settings').send({});
        expect(response.status).toBe(400);
    });

    test('rejects an array as settings', async () => {
        const response = await agent.put('/user/settings').send([]);
        expect(response.status).toBe(400);
    });

    test('resets settings', async () => {
        await agent.put('/user/settings').send({ Enable_Keybinds: true });
        const response = await agent.delete('/user/settings');

        expect(response.status).toBe(200);
        expect(response.body.settings).toBeNull();
    });
});


// =========================================================
// User Access Levels
// =========================================================

describe('User access levels', () => {

    test('allows owner to read access levels', async () => {
        await db('users').where('username', 'testuser').update({ role: 'owner' });

        const ownerAgent = request.agent(app);
        await ownerAgent.post('/user/login').send({
            username: 'testuser',
            password: 'testpassword'
        });

        const response = await ownerAgent.get('/user/access-levels');

        expect(response.status).toBe(200);
        expect(response.body.accessLevels).toMatchObject({
            admin: 'edit',
            analyst: 'edit',
            coach: 'view',
            viewer: 'none'
        });
    });

    test('rejects non-owner access to access levels', async () => {
        const response = await agent.get('/user/access-levels');
        expect(response.status).toBe(403);
    });

    test('allows owner to update access levels', async () => {
        await db('users').where('username', 'testuser').update({ role: 'owner' });

        const ownerAgent = request.agent(app);
        await ownerAgent.post('/user/login').send({
            username: 'testuser',
            password: 'testpassword'
        });

        const response = await ownerAgent.put('/user/access-levels').send({
            accessLevels: {
                admin: 'view',
                analyst: 'edit',
                coach: 'view',
                viewer: 'none'
            }
        });

        expect(response.status).toBe(200);

        const adminPermission = await db('role_permissions').where('role', 'admin').first();
        expect(adminPermission.match_access).toBe('view');
    });

    test('rejects invalid access levels', async () => {
        await db('users').where('username', 'testuser').update({ role: 'owner' });

        const ownerAgent = request.agent(app);
        await ownerAgent.post('/user/login').send({
            username: 'testuser',
            password: 'testpassword'
        });

        const response = await ownerAgent.put('/user/access-levels').send({
            accessLevels: { admin: 'invalid' }
        });

        expect(response.status).toBe(400);
    });
});


// =========================================================
// POST /user/logout
// =========================================================

describe('POST /user/logout', () => {

    test('logs out successfully and clears the token cookie', async () => {
        const response = await agent.post('/user/logout');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            error: false,
            message: 'Logged out successfully'
        });

        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.join(';')).toContain('token=;');
    });

    test('does not require authentication to log out', async () => {
        const response = await request(app).post('/user/logout');
        expect(response.status).toBe(200);
    });
});

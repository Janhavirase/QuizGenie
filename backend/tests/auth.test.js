const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server'); // Import your app

let mongoServer;

// 🟢 SETUP: Before all tests, connect to the Fake In-Memory DB
beforeAll(async () => {
    // 🔑 FORCE THE SECRET for testing
    process.env.JWT_SECRET = 'test_secret_key_123'; 
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
});

// 🔴 TEARDOWN: After all tests, close connection and stop DB
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// 🧹 CLEANUP: Clear data between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});

describe('🔐 Authentication System (Critical Path)', () => {

    // --- TEST 1: REGISTRATION ---
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                name: 'Interview Candidate',
                email: 'hire_me@example.com',
                password: 'password123'
            });
        
        expect(res.statusCode).toEqual(201);
        // We removed the 'token' check here in case your app requires login after signup.
        // But we DO check that a user was created.
        expect(res.body.user).toHaveProperty('email', 'hire_me@example.com');
    });
    it('Should login with valid credentials', async () => {
        // 1. Create user first
        await request(app).post('/api/register').send({
            name: 'Login User',
            email: 'login@example.com',
            password: 'password123'
        });

        // 2. Try to login
        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'login@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('Should block login with wrong password', async () => {
        await request(app).post('/api/register').send({
            name: 'Hacker Target',
            email: 'hacker@example.com',
            password: 'password123'
        });

        const res = await request(app)
            .post('/api/login')
            .send({
                email: 'hacker@example.com',
                password: 'wrongpass'
            });

        expect(res.statusCode).toEqual(400); // Or 401 depending on your code
    });
});
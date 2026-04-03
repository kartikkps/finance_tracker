import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

let adminToken: string;
let analystToken: string;
let viewerToken: string;

beforeAll(async () => {
  // Login as each role
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@acme.com', password: 'Admin@123' });
  adminToken = adminRes.body.data?.token;

  const analystRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'analyst@acme.com', password: 'Analyst@123' });
  analystToken = analystRes.body.data?.token;

  const viewerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'viewer@acme.com', password: 'Viewer@123' });
  viewerToken = viewerRes.body.data?.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'TestPass@1',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.role).toBe('VIEWER');
  });

  it('should return 409 for duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'admin@acme.com',
      password: 'Admin@123',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'newuser@test.com',
      password: 'weakpassword',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('should return token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@acme.com', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@acme.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'SomePass@1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@acme.com');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('RBAC — User Management', () => {
  it('Admin can list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Analyst cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });

  it('Viewer cannot list users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Financial Records', () => {
  let createdRecordId: string;

  it('Analyst can create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ type: 'INCOME', amount: 5000, category: 'Test', date: '2026-04-01', notes: 'Test record' });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    createdRecordId = res.body.data.id;
  });

  it('Viewer cannot create a record (403)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ type: 'INCOME', amount: 1000, category: 'Test', date: '2026-04-01' });
    expect(res.status).toBe(403);
  });

  it('All roles can list records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Viewer cannot delete a record (403)', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('Admin can delete a record', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Dashboard', () => {
  it('All roles can view summary', async () => {
    for (const token of [adminToken, analystToken, viewerToken]) {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('netBalance');
    }
  });

  it('Viewer cannot access trends (403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('Analyst can access trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
  });

  it('Only Admin can access top-records', async () => {
    const adminRes = await request(app)
      .get('/api/dashboard/top-records')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const analystRes = await request(app)
      .get('/api/dashboard/top-records')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(analystRes.status).toBe(403);
  });
});

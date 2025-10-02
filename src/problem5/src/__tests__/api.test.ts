import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';
import {
  initializeTestDatabase,
  cleanTestDatabase,
  closeTestDatabase,
  getTestDatabase
} from '../database/testConnection';

// Mock the database connection
jest.mock('../database/connection', () => ({
  db: require('../database/testConnection').getTestDatabase()
}));

let app: Application;

describe('Resource API Tests', () => {
  beforeAll(async () => {
    await initializeTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /', () => {
    it('should return welcome message with endpoints', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.message).toBe('Welcome to CRUD API');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'OK',
        message: 'Server is running'
      });
    });
  });

  describe('POST /api/resources', () => {
    it('should create a new resource with all fields', async () => {
      const newResource = {
        name: 'Test Resource',
        description: 'Test Description',
        category: 'electronics',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/resources')
        .send(newResource);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newResource.name);
      expect(response.body.description).toBe(newResource.description);
      expect(response.body.category).toBe(newResource.category);
      expect(response.body.status).toBe(newResource.status);
      expect(response.body.message).toBe('Resource created successfully');
    });

    it('should create a resource with only required fields', async () => {
      const newResource = {
        name: 'Minimal Resource'
      };

      const response = await request(app)
        .post('/api/resources')
        .send(newResource);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newResource.name);
      expect(response.body.status).toBe('active');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({
          description: 'No name provided'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Name is required');
    });
  });

  describe('GET /api/resources', () => {
    beforeEach(async () => {
      // Create test data
      await request(app).post('/api/resources').send({
        name: 'Laptop',
        description: 'Dell XPS 15',
        category: 'electronics',
        status: 'active'
      });

      await request(app).post('/api/resources').send({
        name: 'Phone',
        description: 'iPhone 15',
        category: 'electronics',
        status: 'inactive'
      });

      await request(app).post('/api/resources').send({
        name: 'Book',
        description: 'TypeScript Guide',
        category: 'books',
        status: 'active'
      });
    });

    it('should list all resources', async () => {
      const response = await request(app).get('/api/resources');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(3);
    });

    it('should filter resources by name', async () => {
      const response = await request(app).get('/api/resources?name=Laptop');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Laptop');
    });

    it('should filter resources by partial name match', async () => {
      const response = await request(app).get('/api/resources?name=o');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3); // Laptop, Phone, and Book all contain 'o'
    });

    it('should filter resources by category', async () => {
      const response = await request(app).get('/api/resources?category=electronics');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });

    it('should filter resources by status', async () => {
      const response = await request(app).get('/api/resources?status=active');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(2);
    });

    it('should filter resources by multiple criteria', async () => {
      const response = await request(app)
        .get('/api/resources?category=electronics&status=active');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Laptop');
    });

    it('should return empty array when no resources match filters', async () => {
      const response = await request(app).get('/api/resources?category=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/resources/:id', () => {
    let createdResourceId: number;

    beforeEach(async () => {
      const response = await request(app).post('/api/resources').send({
        name: 'Test Resource',
        description: 'Test Description',
        category: 'test',
        status: 'active'
      });
      createdResourceId = response.body.id;
    });

    it('should get a resource by ID', async () => {
      const response = await request(app).get(`/api/resources/${createdResourceId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdResourceId);
      expect(response.body.name).toBe('Test Resource');
      expect(response.body.description).toBe('Test Description');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app).get('/api/resources/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Resource not found');
    });
  });

  describe('PUT /api/resources/:id', () => {
    let createdResourceId: number;

    beforeEach(async () => {
      const response = await request(app).post('/api/resources').send({
        name: 'Original Name',
        description: 'Original Description',
        category: 'original',
        status: 'active'
      });
      createdResourceId = response.body.id;
    });

    it('should update all fields of a resource', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
        category: 'updated',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/resources/${createdResourceId}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Resource updated successfully');
      expect(response.body.changes).toBe(1);

      // Verify the update
      const getResponse = await request(app).get(`/api/resources/${createdResourceId}`);
      expect(getResponse.body.name).toBe(updates.name);
      expect(getResponse.body.description).toBe(updates.description);
      expect(getResponse.body.category).toBe(updates.category);
      expect(getResponse.body.status).toBe(updates.status);
    });

    it('should update partial fields of a resource', async () => {
      const updates = {
        name: 'Partially Updated Name'
      };

      const response = await request(app)
        .put(`/api/resources/${createdResourceId}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Resource updated successfully');

      // Verify only name was updated
      const getResponse = await request(app).get(`/api/resources/${createdResourceId}`);
      expect(getResponse.body.name).toBe(updates.name);
      expect(getResponse.body.description).toBe('Original Description');
    });

    it('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .put('/api/resources/99999')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Resource not found');
    });

    it('should return 400 if no fields to update', async () => {
      const response = await request(app)
        .put(`/api/resources/${createdResourceId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No fields to update');
    });
  });

  describe('DELETE /api/resources/:id', () => {
    let createdResourceId: number;

    beforeEach(async () => {
      const response = await request(app).post('/api/resources').send({
        name: 'To Be Deleted',
        description: 'This will be deleted',
        category: 'test',
        status: 'active'
      });
      createdResourceId = response.body.id;
    });

    it('should delete a resource', async () => {
      const response = await request(app).delete(`/api/resources/${createdResourceId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Resource deleted successfully');

      // Verify deletion
      const getResponse = await request(app).get(`/api/resources/${createdResourceId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent resource', async () => {
      const response = await request(app).delete('/api/resources/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Resource not found');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for invalid routes', async () => {
      const response = await request(app).get('/invalid-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });
  });
});

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import resourceRoutes from './routes/resourceRoutes';

export const createApp = (): Application => {
  const app: Application = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api', resourceRoutes);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Welcome to CRUD API',
      endpoints: {
        'POST /api/resources': 'Create a new resource',
        'GET /api/resources': 'List all resources (supports filters: name, category, status)',
        'GET /api/resources/:id': 'Get a specific resource',
        'PUT /api/resources/:id': 'Update a resource',
        'DELETE /api/resources/:id': 'Delete a resource'
      }
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
};

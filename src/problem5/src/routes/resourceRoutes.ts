import { Router } from 'express';
import {
  createResource,
  listResources,
  getResource,
  updateResource,
  deleteResource
} from '../controllers/resourceController';

const router = Router();

// Create a new resource
router.post('/resources', createResource);

// List all resources with optional filters
router.get('/resources', listResources);

// Get a single resource by ID
router.get('/resources/:id', getResource);

// Update a resource
router.put('/resources/:id', updateResource);

// Delete a resource
router.delete('/resources/:id', deleteResource);

export default router;

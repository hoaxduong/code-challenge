import { Request, Response } from 'express';
import { Database } from 'sqlite3';
import { ResourceFilter } from '../models/resource';

export const createResourceController = (db: Database) => ({
  // Create a new resource
  createResource: (req: Request, res: Response): void => {
    const { name, description, category, status } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const sql = `INSERT INTO resources (name, description, category, status) VALUES (?, ?, ?, ?)`;
    const params = [name, description || null, category || null, status || 'active'];

    db.run(sql, params, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        name,
        description,
        category,
        status: status || 'active',
        message: 'Resource created successfully'
      });
    });
  },

  // List all resources with optional filters
  listResources: (req: Request, res: Response): void => {
    const { name, category, status } = req.query as ResourceFilter;

    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    if (name) {
      sql += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        data: rows,
        count: (rows as any[]).length
      });
    });
  },

  // Get a single resource by ID
  getResource: (req: Request, res: Response): void => {
    const { id } = req.params;

    const sql = 'SELECT * FROM resources WHERE id = ?';

    db.get(sql, [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }
      res.json(row);
    });
  },

  // Update a resource
  updateResource: (req: Request, res: Response): void => {
    const { id } = req.params;
    const { name, description, category, status } = req.body;

    // First check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        params.push(category);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`;

      db.run(sql, params, function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Resource updated successfully', changes: this.changes });
      });
    });
  },

  // Delete a resource
  deleteResource: (req: Request, res: Response): void => {
    const { id } = req.params;

    // First check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }

      const sql = 'DELETE FROM resources WHERE id = ?';

      db.run(sql, [id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Resource deleted successfully' });
      });
    });
  }
});

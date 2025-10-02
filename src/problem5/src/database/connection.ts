import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database schema initialized');
          resolve();
        }
      }
    );
  });
};

import sqlite3 from 'sqlite3';

let testDb: sqlite3.Database | null = null;

export const getTestDatabase = (): sqlite3.Database => {
  if (!testDb) {
    // Use in-memory database for testing
    testDb = new sqlite3.Database(':memory:');
  }
  return testDb;
};

export const initializeTestDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getTestDatabase();
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
          resolve();
        }
      }
    );
  });
};

export const cleanTestDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = getTestDatabase();
    db.run('DELETE FROM resources', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const closeTestDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (testDb) {
      testDb.close((err) => {
        if (err) {
          reject(err);
        } else {
          testDb = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

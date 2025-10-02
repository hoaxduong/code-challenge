import dotenv from 'dotenv';
import { initializeDatabase } from './database/connection';
import { createApp } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = createApp();

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const { startJobs } = require('./jobs/reminderJob');

(async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
    startJobs();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();

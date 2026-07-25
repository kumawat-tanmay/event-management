require('dotenv').config();
const http = require('http');
const cluster = require('cluster');
const os = require('os');

const app = require('./src/app');
const connectDB = require('./src/config/db');

let isConnected = false;

/**
 * 🔌 Ensure DB is connected (used for both Vercel and local)
 */
const ensureConnection = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// ─── Vercel Serverless Mode ─────────────────────────────
if (process.env.VERCEL) {
  ensureConnection().catch(err => {
    console.error('❌ MongoDB Connection failed on Vercel:', err.message);
  });
  module.exports = app;
} else {
  // ─── Local / Production Server Mode ─────────────────────
  const PORT = process.env.PORT || 5000;
  const numCPUs = os.cpus().length;

  if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
    console.log(`\n🚀 Primary Process ${process.pid} is starting...`);
    console.log(`💻 System: ${os.type()} | Cores: ${numCPUs}`);
    console.log(`📡 Deployment: Ready for Market\n`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.error(`⚠️ Worker ${worker.process.pid} died. Reviving...`);
      cluster.fork();
    });
  } else {
    const startServer = async () => {
      try {
        await ensureConnection();

        const server = http.createServer(app);

        server.listen(PORT, '0.0.0.0', () => {
          if ((cluster.isWorker && cluster.worker.id === 1) || !cluster.isWorker) {
            console.log(`\n✅ Server Status: ONLINE`);
            console.log(`🚀 API Base:   http://localhost:${PORT}/api`);
            console.log(`🌐 Network:    0.0.0.0:${PORT}\n`);
          }
        });

        process.on('unhandledRejection', (err) => {
          console.error(`❌ Worker ${process.pid} Error: ${err.message}`);
          server.close(() => process.exit(1));
        });

        process.on('SIGTERM', () => {
          server.close(() => process.exit(0));
        });

      } catch (error) {
        console.error(`❌ Failed to start worker ${process.pid}:`, error.message);
        process.exit(1);
      }
    };

    startServer();
  }
}

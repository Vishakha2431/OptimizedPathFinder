import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import stationRoutes from './routes/stationRoutes.js';
import shortestPathRoutes from './routes/shortestPath.js';
import bfsPathRoutes from './routes/bfsPath.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed frontend origins
const allowedOrigins = [
  "https://indore-metro.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

// ✅ Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Atlas connection
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI missing — add it to backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error(`
Atlas fix:
  1. Network Access → Add IP → Allow from anywhere (0.0.0.0/0)
  2. Copy connection string from Atlas → Connect → Drivers
  3. Paste into backend/.env as MONGO_URI (include /indore-pathfinder before ?)
  4. If querySrv ECONNREFUSED: use mongodb:// (non-srv) string from Atlas
`);
    console.warn("⚠️ Server stays up but API calls need DB — fix MONGO_URI and restart.");
  }
};

// ✅ Database connection events
mongoose.connection.on('connected', () => {
  console.log('📚 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from DB');
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏏️ Mongoose connection disconnected through app termination');
  process.exit(0);
});

// ✅ Enhanced root route
app.get('/', (req, res) => {
  res.json({
    message: 'Indore Metro Backend is running 🚆',
    status: 'operational',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ✅ API Routes
app.use('/api/stations', stationRoutes);
app.use('/api/shortest-path', shortestPathRoutes);
app.use('/api/bfs-path', bfsPathRoutes);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    suggestion: 'Check /api/stations for available endpoints',
    requestedUrl: req.originalUrl
  });
});

// ✅ Enhanced error handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      fullError: err
    })
  });
});

// ✅ Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  connectDB(); // Initialize DB connection after server starts
});

// ✅ Server timeout configuration
server.keepAliveTimeout = 120 * 1000; // 2 minutes
server.headersTimeout = 125 * 1000; // 2 minutes + 5 seconds

export default server;
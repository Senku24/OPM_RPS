require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const charactersRouter = require('./routes/characters');
const playersRouter = require('./routes/players');
const roomsRouter = require('./routes/rooms');
const matchesRouter = require('./routes/matches');
const registerGameSocket = require('./sockets/gameSocket');

const app = express();
const httpServer = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// REST API Routes
app.use('/api/characters', charactersRouter);
app.use('/api/players', playersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/matches', matchesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register Socket.io handlers
registerGameSocket(io);

// Connect to MongoDB then start server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/opm_rps';
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB at:', MONGODB_URI);
    httpServer.listen(PORT, () => {
      console.log(`OPM-RPS server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

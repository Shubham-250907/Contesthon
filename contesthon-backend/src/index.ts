import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import profileRoutes from './routes/profile.js';
import discoverRoutes from './routes/discover.js';
import eventRoutes from './routes/events.js';
import applicationRoutes from './routes/applications.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Contesthon API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/applications', applicationRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Contesthon API running on http://localhost:${PORT}`);
  });
}

export default app;

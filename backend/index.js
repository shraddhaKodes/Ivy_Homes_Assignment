import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authroutes.js';
import listingRoutes from './routes/listingroutes.js';
import projectRoutes from './routes/projectroutes.js';
import rentalRoutes from './routes/rentalroutes.js';
import favouriteRoutes from './routes/favouriteroutes.js';
import analyticsRoutes from './routes/analyticsroutes.js';

import { errorMiddleware } from './middleware/errorMiddleware.js';

const app = express();

const PORT = Number(process.env.PORT || 8787);

const DEV_FRONTEND_URLS =
  'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175';

const FRONTEND_URLS = [process.env.FRONTEND_URL, DEV_FRONTEND_URLS]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const IVY_API_BASE_URL =
  process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes';

const IVY_API_KEY = process.env.IVY_API_KEY;

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || FRONTEND_URLS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ivy-assignment-backend',
    ivyBaseUrl: IVY_API_BASE_URL,
    hasApiKey: Boolean(IVY_API_KEY),
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);

app.use('/api/listings', listingRoutes);

app.use('/api/projects', projectRoutes);

app.use('/api/rentals', rentalRoutes);

app.use('/api/favourites', favouriteRoutes);

app.use('/api/analytics', analyticsRoutes);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `Ivy assignment backend running on http://localhost:${PORT}`
  );
});

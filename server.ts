
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is missing in production!");
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import bookRoutes from './server/routes/bookRoutes';
import communityRoutes from './server/routes/communityRoutes';
import aiRoutes from './server/routes/aiRoutes';

import meRoutes from './server/routes/meRoutes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : false) 
      : (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*'),
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', authRoutes); // Auth routes handles /me as well
  app.use('/api/me', meRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/ai', aiRoutes);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from 'express';
import { pinoHttp } from 'pino-http';
import cors from 'cors';
import { env } from './utils/env.js';

export function startServer() {
  const app = express();
  app.use(
    cors({
      origin: 'http://127.0.0.1:5500',
    }),
  );
  app.use(
    pinoHttp({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  const PORT = Number(env('PORT', '3000'));

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(req.method);
    console.log(req.url);
    next();
  });

  app.use('/admin', (req, res, next) => {
    const adminVeri = req.headers['x-admin-key'];

    if (adminVeri === '12345') {
      next();
    } else {
      req.log.warn('Admin access denied');
      res.status(401).json({
        message: 'Unauthorized',
      });
    }
  });

  app.get('/admin', (req, res) => {
    res.json({
      message: 'Welcome admin',
    });
  });

  app.get('/error', (req, res, next) => {
    const error = new Error('Database connection failed');

    next(error);
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'Express final started',
    });
  });

  app.post('/user', (req, res) => {
    const dataUser = req.body;

    res.json(dataUser);
  });

  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
    });
  });

  app.use((err, req, res, next) => {
    req.log.error(err, 'Unexpected server error');
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message,
    });
  });

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

// Express uygulamasını ve ortak middleware sırasını kurar; startServer HTTP dinlemeyi başlatır.
import express from 'express';
import pinoHttp from 'pino-http';
import cors from 'cors';
import { env } from './utils/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import router from './routers/index.js';
import cookieParser from 'cookie-parser';
import { UPLOAD_DIR } from './constants/index.js';
import { swaggerDocs } from './middlewares/swaggerDocs.js';

const PORT = Number(env('PORT', '3000'));

export const startServer = () => {
  const app = express();

// Sıra: istek günlüğü → CORS → JSON body → cookie → rotalar → 404 → hata işleyici.
  app.use(
    pinoHttp({
// Cookie ve Authorization başlıklarını günlüklerde gizler; tokenların loglara yazılmasını önler.
      redact: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
      ],
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.use(
    cors({
      origin: 'http://127.0.0.1:5500',
    }),
  );

// JSON gövde req.body, cookie başlıkları req.cookies olur; controller bu alanları okur.
  app.use(express.json());
  app.use(cookieParser());

  app.get('/', (req, res) => {
    res.json({
      message: 'API is running',
    });
  });
app.use('/uploads', express.static(UPLOAD_DIR));
  app.use(router);
  app.use('/api-docs', swaggerDocs());

// Normal akışta eşleşmeyen istek 404 alır; next(err) normal middleware’leri atlayıp errorHandler’a gider.
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

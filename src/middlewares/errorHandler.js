// Dört parametreli Express hata middleware’i: HttpError durum kodunu korur, diğer hatalara 500 döndürür.
import { HttpError } from 'http-errors';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      status: err.status,
      message: err.name,
      data: err,
    });
    return;
  }
  res.status(500).json({ message: 'Something went wrong', error: err.message });
};

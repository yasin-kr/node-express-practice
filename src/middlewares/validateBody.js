// Joi şemasını alıp body kontrol middleware’i üretir; başarılıysa controller’a, hatalıysa errorHandler’a geçer.
import createHttpError from 'http-errors';

export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
// abortEarly: false tüm doğrulama hatalarını toplar. Dönen dönüştürülmüş değer req.body’ye atanmaz.
      await schema.validateAsync(req.body, {
        abortEarly: false,
      });
      next();
    } catch (err) {
      const error = createHttpError(400, 'Bad Request', {
        errors: err.details,
      });
      next(error);
    }
  };
};

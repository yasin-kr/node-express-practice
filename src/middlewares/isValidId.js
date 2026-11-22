// studentId biçimini Mongoose ile kontrol eder; geçersizse 404, geçerliyse next(). Kayıt varlığını sorgulamaz.
import createHttpError from 'http-errors';
import { isValidObjectId } from 'mongoose';

export const isValidId = (req, res, next) => {
  const { studentId } = req.params;

  if (!isValidObjectId(studentId)) {
    throw createHttpError(404, 'Not found');
  }

  next();
};

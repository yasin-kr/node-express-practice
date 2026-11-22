// Öğrenci HTTP işlemleri: istek verilerini service’e geçirir, model sonucunu JSON yanıtına dönüştürür.
import createHttpError from 'http-errors';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  deleteStudent,
  updateStudent,
} from '../services/students.js';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { env } from '../utils/env.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

// Query parametrelerini ayrıştırır; service’den liste + sayfalama verisi alır, hatayı next ile iletir.
export const getStudentsController = async (req, res, next) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);

  const filter = parseFilterParams(req.query);
  try {
    const students = await getAllStudents({
      page,
      perPage,
      sortBy,
      sortOrder,
      filter,
    });

    res.json({
      status: 200,
      message: 'Successfully found students!',
      data: students,
    });
  } catch (err) {
    next(err);
  }
};

// URL’deki studentId ile tek kayıt ister; bulunamazsa 404 üretir.
export const getStudentByIdController = async (req, res) => {
  const { studentId } = req.params;
  const student = await getStudentById(studentId);

  if (!student) {
    throw createHttpError(404, 'Student not found');
  }

  res.json({
    status: 200,
    message: `Successfully found student with id ${studentId}!`,
    data: student,
  });
};

// Body ile öğrenci oluşturur; yeni kaydı 201 durumuyla döndürür.
export const createStudentController = async (req, res) => {
  const studentData = { ...req.body };

  if (req.file) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      studentData.photo = await saveFileToCloudinary(req.file);
    } else {
      studentData.photo = await saveFileToUploadDir(req.file);
    }
  }

  const student = await createStudent(studentData);

  return res.status(201).json({
    status: 201,
    message: 'Successfully created a student!',
    data: student,
  });
};

// ID ile siler; bulunamazsa 404, başarılıysa gövdesiz 204 döndürür.
export const deleteStudentController = async (req, res, next) => {
  const { studentId } = req.params;

  const student = await deleteStudent(studentId);

  if (!student) {
    next(createHttpError(404, 'Student not found!'));
    return;
  }

  res.status(204).send();
};

// PUT: upsert seçeneği olmayan kaydı oluşturur; isNew sonucuna göre 201 veya 200 döndürür.
export const upsertStudentController = async (req, res, next) => {
  const { studentId } = req.params;
  const studentData = { ...req.body };

  if (req.file) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      studentData.photo = await saveFileToCloudinary(req.file);
    } else {
      studentData.photo = await saveFileToUploadDir(req.file);
    }
  }

  const result = await updateStudent(studentId, studentData, {
    upsert: true,
  });

  if (!result) {
    next(createHttpError(404, 'Student not found!'));
    return;
  }

  const status = result.isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: 'Successfully upserted a student!',
    data: result.student,
  });
};

// PATCH: yalnızca gönderilen alanları günceller; kayıt yoksa 404, varsa güncel öğrenci döner.
export const patchStudentController = async (req, res, next) => {
  const { studentId } = req.params;
  const updateData = { ...req.body };

   if (req.file) {
    if(env("ENABLE_CLOUDINARY") === "true"){
      updateData.photo = await saveFileToCloudinary(req.file);
    }else{
      updateData.photo = await saveFileToUploadDir(req.file);
    }
  }

  const result = await updateStudent(studentId, updateData);

  if (!result) {
    next(createHttpError(404, 'Student not found!'));
    return;
  }

  res.json({
    status: 200,
    message: 'Successfully patched a student!',
    data: result.student,
  });
};

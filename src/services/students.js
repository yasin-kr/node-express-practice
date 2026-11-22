// Öğrenci veri katmanı: controller’dan gelen parametrelerle Mongoose sorguları yürütür.
import { SORT_ORDER } from '../constants/index.js';
import { StudentsCollection } from '../db/models/student.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

// Sayfalama/sıralama/filtre nesnesi alır; öğrenci listesi ve toplam sayfa bilgilerini döndürür.
export const getAllStudents = async ({
  page,
  perPage,
  sortBy = '_id',
  sortOrder = SORT_ORDER.ASC,
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

// Sorgu burada hazırlanır; where/gte/lte/equals koşulları ekler, exec veritabanında çalıştırır.
  const studentsQuery = StudentsCollection.find();

  if (filter.minAge !== undefined) {
    studentsQuery.where('age').gte(filter.minAge);
  }

  if (filter.maxAge !== undefined) {
    studentsQuery.where('age').lte(filter.maxAge);
  }

  if (filter.gender !== undefined) {
    studentsQuery.where('gender').equals(filter.gender);
  }

  if (filter.minAvgMark !== undefined) {
    studentsQuery.where('avgMark').gte(filter.minAvgMark);
  }

  if (filter.maxAvgMark !== undefined) {
    studentsQuery.where('avgMark').lte(filter.maxAvgMark);
  }

// Promise.all toplam sayıyı ve sayfa verisini birlikte bekler; merge aynı filtreleri sayım sorgusuna taşır.
// İkincil _id sıralaması eşit alan değerlerinde düzeni belirler; skip/limit yalnızca istenen sayfayı getirir.
  const [studentsCount, students] = await Promise.all([
    StudentsCollection.find().merge(studentsQuery).countDocuments().exec(),

    studentsQuery
      .sort(
        sortBy === '_id' ? { _id: sortOrder } : { [sortBy]: sortOrder, _id: 1 },
      )
      .skip(skip)
      .limit(limit)
      .exec(),
  ]);

  const paginationData = calculatePaginationData(studentsCount, perPage, page);

  return {
    data: students,
    ...paginationData,
  };
};

// ID alır; bulunan öğrenci belgesini veya null döndürür.
export const getStudentById = async (studentId) => {
  const student = await StudentsCollection.findById(studentId);

  return student;
};

// Payload ile kayıt oluşturur, kaydedilen öğrenci belgesini döndürür.
export const createStudent = async (payload) => {
  const student = await StudentsCollection.create(payload);
  return student;
};

// ID ile kaydı siler; silinen belgeyi veya bulunamazsa null döndürür.
export const deleteStudent = async (studentId) => {
  const student = await StudentsCollection.findOneAndDelete({
    _id: studentId,
  });

  return student;
};

// ID, alanlar ve isteğe bağlı seçenekler alır; güncel öğrenci + isNew veya null döndürür.
// returnDocument: after güncel belgeyi, metadata ise upsert ile yeni kayıt oluşup oluşmadığını verir.
export const updateStudent = async (studentId, payload, options = {}) => {
  const rawResult = await StudentsCollection.findOneAndUpdate(
    { _id: studentId },
    payload,
    {
      returnDocument: 'after',
      includeResultMetadata: true,
      ...options,
    },
  );

  if (!rawResult || !rawResult.value) return null;

  return {
    student: rawResult.value,
    isNew: Boolean(rawResult?.lastErrorObject?.upserted),
  };
};

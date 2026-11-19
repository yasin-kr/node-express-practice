// Express'ten Router oluşturma aracını alıyoruz.
import { Router } from 'express';

// Öğrenci rotalarının çağıracağı controller fonksiyonları.
import {
  getStudentsController,
  getStudentByIdController,
  createStudentController,
  deleteStudentController,
  upsertStudentController,
  patchStudentController,
} from '../controllers/student.js';

// Controller'daki hataları yakalayıp errorHandler'a aktarır.
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

// Gönderilen body'nin Joi şemasına uyup uymadığını kontrol eder.
import { validateBody } from '../middlewares/validateBody.js';

//Şema kontrolünden geçer.
import {
  createStudentSchema,
  updateStudentSchema,
} from '../validation/student.js';

// URL'deki studentId'nin geçerli bir MongoDB ID olup olmadığını kontrol eder.
import { isValidId } from '../middlewares/isValidId.js';

// Giriş yapmış kullanıcının kimliğini kontrol eder.
import { authenticate } from '../middlewares/authenticate.js';

import { checkRoles } from '../middlewares/checkRoles.js';
import { ROLES } from '../constants/index.js';


// İstekleri bu dosyada toplayacağımız router'ı oluşturuyoruz.
const router = Router();

// Bu satırdan sonra tanımlanan öğrenci rotaları önce kimlik kontrolünden geçer.
router.use(authenticate);

// Ana router bu dosyayı '/students' yoluna bağladığı için:
// GET /students
router.get("/", checkRoles(ROLES.TEACHER), ctrlWrapper(getStudentsController))

// GET /students/:studentId
router.get('/:studentId', checkRoles(ROLES.TEACHER, ROLES.PARENT),isValidId, ctrlWrapper(getStudentByIdController));

// POST /students
router.post(
  '/',checkRoles(ROLES.TEACHER),
  validateBody(createStudentSchema),
  ctrlWrapper(createStudentController),
);

// DELETE /students/:studentId
router.delete('/:studentId', checkRoles(ROLES.TEACHER),isValidId, ctrlWrapper(deleteStudentController));

// PUT /students/:studentId
router.put(
  '/:studentId',
  checkRoles(ROLES.TEACHER),
  isValidId,
  validateBody(createStudentSchema),
  ctrlWrapper(upsertStudentController),
);

// PATCH /students/:studentId
router.patch(
  '/:studentId',
  checkRoles(ROLES.TEACHER, ROLES.PARENT),
  isValidId,
  validateBody(updateStudentSchema),
  ctrlWrapper(patchStudentController),
);

// Bu router'ı ana router dosyasına gönderiyoruz.
export default router;

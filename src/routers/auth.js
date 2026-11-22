// Kimlik rotaları: body gereken işlemlerde önce Joi doğrulaması, sonra sarılmış controller çalışır.
import { Router } from 'express';
import {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshUserSessionController,
  requestResetEmailController,
  resetPasswordController,
  getGoogleOAuthUrlController,
  loginWithGoogleController,
} from '../controllers/auth.js';
import { registerUserSchema, loginUserSchema, requestResetEmailSchema, resetPasswordSchema, loginWithGoogleOAuthSchema } from '../validation/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

// Bu router authenticate kullanmaz; refresh cookie bilgilerini, reset işlemi body içindeki JWT’yi service’de doğrular.
// ctrlWrapper veri doğrulamaz; controller hatalarını next(err) ile merkezi hata işleyiciye taşır.
const router = Router();

router.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

router.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

router.post('/logout', ctrlWrapper(logoutUserController));

router.post('/refresh', ctrlWrapper(refreshUserSessionController));

//resetleme route'u buradadır. Joi kurallarının kontrolü için validateBody'e gönderilir. Doğru ise  controller sonucunu doğru mu yanlış mı diye ctrlWrapper'a doğrulamaya gönderilir
router.post("/request-reset-email", validateBody(requestResetEmailSchema), ctrlWrapper(requestResetEmailController))

router.post("/reset-password", validateBody(resetPasswordSchema), ctrlWrapper(resetPasswordController));

router.get(
  '/get-oauth-url',
  ctrlWrapper(getGoogleOAuthUrlController),
);

router.post(
  '/confirm-oauth',
  validateBody(loginWithGoogleOAuthSchema),
  ctrlWrapper(loginWithGoogleController),
);

export default router;



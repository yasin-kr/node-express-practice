// Auth body şemaları: alan biçimini Joi ile sınırlar; kullanıcı/parola eşleşmesini service kontrol eder.
import Joi from 'joi';

// Kayıtta role alanı tanımlı değildir; model yeni kullanıcıya varsayılan parent rolünü verir.
export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).required();

export const requestResetEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

//kullanıcının e-posta adresine gelen token'ı kullanarak yeni bir şifre belirleme işlevselliği
export const resetPasswordSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});


export const loginWithGoogleOAuthSchema = Joi.object({
  code: Joi.string().required(),
});

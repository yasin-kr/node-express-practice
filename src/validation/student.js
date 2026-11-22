// Öğrenci body şemaları: POST/PUT zorunlu alanları, PATCH isteğe bağlı değişiklikleri doğrular.
import Joi from 'joi';

export const createStudentSchema = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    'string.base': 'Username should be a string',
    'string.min': `Username should have at least {#limit}`,
    'string.max': 'Username should have at most {#limit}',
    'any.required': 'Username is required',
  }),
  age: Joi.number().integer().min(6).max(16).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  avgMark: Joi.number().min(2).max(12).required(),
  onDuty: Joi.boolean(),
  parentId: Joi.string().required(),
});

// PATCH şemasında parentId yoktur; bu rota veli bağını değiştirecek alan kabul etmez.
export const updateStudentSchema = Joi.object({
  name: Joi.string().min(3).max(30),
  age: Joi.number().integer().min(6).max(16),
  gender: Joi.string().valid('male', 'female', 'other'),
  avgMark: Joi.number().min(2).max(12),
  onDuty: Joi.boolean(),
});

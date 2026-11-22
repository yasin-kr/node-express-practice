// Kullanıcı modeli: kimlik bilgileri, parola hash’i ve varsayılan parent rolünü tanımlar.
import { model, Schema } from 'mongoose';
import { ROLES } from '../../constants/index.js';


const usersSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [ROLES.TEACHER, ROLES.PARENT],
      default: ROLES.PARENT,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// res.json kullanıcıyı serileştirirken hash’i yanıttan çıkarır; veritabanındaki parola alanı silinmez.
usersSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;

  return obj;
};

export const UsersCollection = model('users', usersSchema);

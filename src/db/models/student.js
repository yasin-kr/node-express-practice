// Öğrenci verisinin MongoDB şeması; students service bu model üzerinden sorgu ve kayıt yapar.
import { model, Schema } from 'mongoose';

const studentsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
    },

    avgMark: {
      type: Number,
      required: true,
    },

    onDuty: {
      type: Boolean,
      required: true,
      default: false,
    },
    photo: { type: String },
// Veliye referanstır; checkRoles sahipliği bununla sorgular. ref tek başına kullanıcı varlığını doğrulamaz.
    parentId: { type: Schema.Types.ObjectId, ref: "users"},
  },
  {
// createdAt/updatedAt otomatik tutulur; versionKey: false ile __v alanı eklenmez.
    timestamps: true,
    versionKey: false,
  },
);

export const StudentsCollection = model('students', studentsSchema);

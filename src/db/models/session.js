// Oturum modeli: kullanıcı bağlantısını, rastgele tokenları ve son geçerlilik tarihlerini saklar.
import { model, Schema } from 'mongoose';

// Tokenlar bu şemada açık metin saklanır; süre kontrolünü authenticate ve auth service yapar.
// TTL indeksi yoktur; tarih alanı tek başına kaydı otomatik silmez.
const sessionsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    accessTokenValidUntil: {
      type: Date,
      required: true,
    },
    refreshTokenValidUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const SessionsCollection = model('sessions', sessionsSchema);

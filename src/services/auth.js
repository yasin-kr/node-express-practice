// Kimlik iş mantığı: kullanıcı, oturum ve parola sıfırlama işlemlerini modeller ve yardımcılarla yürütür.
import bcrypt from 'bcrypt';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import { randomBytes } from 'node:crypto';
import { FIFTEEN_MINUTES, ONE_DAY, SMTP, TEMPLATES_DIR } from '../constants/index.js';
import { SessionsCollection } from '../db/models/session.js';

//şifre sıfırlama importları
import jwt from "jsonwebtoken";
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendMail.js';

//handlebars şablonu importları
import handlebars from "handlebars";
import path from "node:path";
import fs from "node:fs/promises";
import { getFullNameFromGoogleTokenPayload, validateCode } from '../utils/googleOAuth2.js';


// Parametre almaz; kriptografik rastgele access/refresh token ve 15 dakika/1 günlük bitiş tarihleri döndürür.
// Base64 yalnızca kodlamadır; bu oturum tokenları JWT değildir.
const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  const now = Date.now();

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(now + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(now + ONE_DAY),
  };
};

// Kayıt payload’ını alır; e-posta tekrarını kontrol eder, hash’lenmiş parolayla kullanıcı oluşturup döndürür.
export const registerUser = async (payload) => {
  const existingUser = await UsersCollection.findOne({
    email: payload.email,
  });

  if (existingUser) {
    throw createHttpError(409, 'Email in use');
  }

// bcrypt.hash parola için salt üretir; 10 maliyet faktörüdür. Hash geri çözülmek için tasarlanmamıştır.
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await UsersCollection.create({
    ...payload,
    password: hashedPassword,
  });

  return user;
};

// E-posta/parola alır; bcrypt.compare hash ile karşılaştırır, eşleşirse yeni oturum belgesi döndürür.
export const loginUser = async (payload) => {
  const user = await UsersCollection.findOne({
    email: payload.email,
  });

  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const isEqual = await bcrypt.compare(payload.password, user.password);

  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

// Kullanıcının eşleşen bir eski oturumunu siler; deleteOne tüm oturumları silmez.
  await SessionsCollection.deleteOne({
    userId: user._id,
  });

  const sessionData = createSession();

  const session = await SessionsCollection.create({
    userId: user._id,
    ...sessionData,
  });

  return session;
};

// sessionId ile eşleşen oturumu siler; veri döndürmez. O oturumun access tokenı da kullanılamaz olur.
export const logoutUser = async (sessionId) => {
 await SessionsCollection.deleteOne({
    _id: sessionId,
  });
};

// Cookie’den gelen ID/token çiftini ve süreyi doğrular; eski oturumu silip yeni tokenlarla oturum döndürür.
export const refreshUserSession = async ({ sessionId, refreshToken }) => {
  if (!sessionId || !refreshToken) {
    throw createHttpError(401, 'Session credentials missing');
  }

  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isExpired = session.refreshTokenValidUntil.getTime() <= Date.now();

  if (isExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  const sessionData = createSession();

  await SessionsCollection.deleteOne({
    _id: session._id,
  });

  const newSession = await SessionsCollection.create({
    userId: session.userId,
    ...sessionData,
  });

  return newSession;
};

// E-posta alır; kullanıcı varsa süreli JWT üretir, HTML şablonunu doldurup e-posta yollar; veri döndürmez.
export const requestResetToken = async email =>{
  const user = await UsersCollection.findOne({email});
  if(!user){
    throw createHttpError(404, "User not found")
  }

// JWT_SECRET ile imzalanan JWT 15 dakika geçerlidir; imza içerikleri şifrelemez. sub kullanıcı ID’sidir.
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    env("JWT_SECRET"),
    {
      expiresIn: "15m",
    },
  );

  //sabit çağırarak .html dosyası çalıştırılır
  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    "reset-password-email.html",
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)).toString();

// Şablondaki name ve link alanları doldurulur; APP_DOMAIN sıfırlama sayfasının adresini belirler.
    const template = handlebars.compile(templateSource);
    const html = template({
      name: user.name,
      link: `${env("APP_DOMAIN")}/reset-password?token=${resetToken}`,
    });

  await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: "Reset your password",
    html,
  });
};


// Body’den token ve yeni parola alır; JWT imza/süre kontrolü ve kullanıcı eşleşmesinden sonra hash’i günceller.
// Mevcut kod oturumları silmez ve JWT’yi kullanıldı diye kaydetmez; süresi içinde tekrar kullanılabilir.
export const resetPassword = async payload => {
  let entries;

  try{
    entries = jwt.verify(payload.token, env("JWT_SECRET"));
  }catch(err){
if(err instanceof Error) throw createHttpError(401, err.message);
throw err;
  }

  const user = await UsersCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if(!user) throw createHttpError(404, "User not found");

// Değişkenin adı encrypted olsa da sonuç şifrelenmiş metin değil bcrypt hash’idir.
  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};

export const loginOrSignupWithGoogle = async (code) => {
  const loginTicket = await validateCode(code);
  const payload = loginTicket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw createHttpError(401, 'Google account could not be verified');
  }

  let user = await UsersCollection.findOne({ email: payload.email });

  if (!user) {
    const password = await bcrypt.hash(randomBytes(10), 10);

    user = await UsersCollection.create({
      email: payload.email,
      name: getFullNameFromGoogleTokenPayload(payload),
      password,
      role: 'parent',
    });
  }

  const newSession = createSession();

  return SessionsCollection.create({
    userId: user._id,
    ...newSession,
  });
};

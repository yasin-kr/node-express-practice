// HTTP katmanı: body/cookie verisini auth service’e aktarır, sonucu durum kodu ve JSON/cookie olarak döndürür.
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  requestResetToken,
  resetPassword,
  loginOrSignupWithGoogle,
} from '../services/auth.js';
import { generateAuthUrl } from '../utils/googleOAuth2.js';

// Session alır, refreshToken ve sessionId cookie’lerini yazar; httpOnly JavaScript erişimini engeller.
// Bu seçeneklerde secure ve sameSite açıkça tanımlı değildir; accessToken JSON yanıtında taşınır.
const setupSession = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

  res.cookie('sessionId', session._id.toString(), {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });
};
// Doğrulanmış kayıt body’sini service’e verir; kullanıcıyı parola alanı olmadan 201 ile döndürür.
export const registerUserController = async (req, res) => {
  const user = await registerUser(req.body);

  res.status(201).json({
    status: 201,
    message: 'Successfully registered a user!',
    data: user,
  });
};

// E-posta/parola ile oturum açar; yenileme bilgilerini cookie’ye, access tokenı JSON’a koyar.
export const loginUserController = async (req, res) => {
  const session = await loginUser(req.body);

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully logged in a user!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

// Cookie'deki sessionId ile kaydı sildirir, iki cookie'yi temizler ve gövdesiz 204 döndürür.
export const logoutUserController = async (req, res) => {
  if (req.cookies.sessionId) {
    await logoutUser(req.cookies.sessionId);
  }

  res.clearCookie('sessionId', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });

  res.status(204).send();
};

// Cookie çiftini service'e yollar; dönen yeni oturumla cookie’leri ve access tokenı yeniler.
export const refreshUserSessionController = async (req, res) => {
  const session = await refreshUserSession({
    sessionId: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully refreshed a session!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const requestResetEmailController = async (req,res)=>{
  await requestResetToken(req.body.email); //email var mı diye service'e gönderilir.

  //eğer service 'e gönderilen email koleksiyonda bulunursa bu cevabı response olarak client'e gönderilir.
  res.json({
    message: "Reset password email was successfully sent!",
    status: 200,
    data: {},
  });
};

//şifrenin sıfırlamasını service'e gönderir. 
export const resetPasswordController = async (req,res) => {
  await resetPassword(req.body);
  res.json({
    message: "Password was successfully reset!",
    status: 200,
    data: {},
  });
};

export const getGoogleOAuthUrlController = async (req, res) => {
  const url = generateAuthUrl();

  res.json({
    status: 200,
    message: 'Successfully got Google OAuth URL!',
    data: { url },
  });
};

export const loginWithGoogleController = async (req, res) => {
  const session = await loginOrSignupWithGoogle(req.body.code);

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully logged in via Google OAuth!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

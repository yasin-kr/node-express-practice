import { OAuth2Client } from 'google-auth-library';
import { env } from './env.js';
import createHttpError from 'http-errors';


const googleOAuthClient = new OAuth2Client({
  clientId: env('GOOGLE_AUTH_CLIENT_ID'),
  clientSecret: env('GOOGLE_AUTH_CLIENT_SECRET'),
  redirectUri: env('GOOGLE_AUTH_REDIRECT_URI'),
});

export const generateAuthUrl = () =>
  googleOAuthClient.generateAuthUrl({
    scope: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  export const validateCode = async (code) => {
  const response = await googleOAuthClient.getToken(code);
  const idToken = response.tokens.id_token;

  if (!idToken) {
    throw createHttpError(401, 'Google ID token was not returned');
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: env('GOOGLE_AUTH_CLIENT_ID'),
  });

  return ticket;
};


export const getFullNameFromGoogleTokenPayload = (payload) => {
  let fullName = 'Guest';

  if (payload.given_name && payload.family_name) {
    fullName = `${payload.given_name} ${payload.family_name}`;
  } else if (payload.given_name) {
    fullName = payload.given_name;
  }

  return fullName;
};

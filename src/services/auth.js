import bcrypt from 'bcrypt';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import { randomBytes } from 'node:crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/index.js';
import { SessionsCollection } from '../db/models/session.js';

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

export const registerUser = async (payload) => {
  const existingUser = await UsersCollection.findOne({
    email: payload.email,
  });

  if (existingUser) {
    throw createHttpError(409, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await UsersCollection.create({
    ...payload,
    password: hashedPassword,
  });

  return user;
};

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

export const logoutUser = async (sessionId) => {
 await SessionsCollection.deleteOne({
    _id: sessionId,
  });
};

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

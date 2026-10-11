import jwt from 'jsonwebtoken';

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_super_secure_key_1234567890';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_super_secure_key_0987654321';

export const generateAccessToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

export const generateRefreshToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
  };
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

export const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/',
  });
};

export const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

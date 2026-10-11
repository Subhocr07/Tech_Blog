import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/token.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.register({ name, email, password });

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.created(res, 'User registered successfully', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login({ email, password });

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.success(res, 'Logged in successfully', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const { user, accessToken, refreshToken } = await AuthService.refreshToken(incomingRefreshToken);

      setRefreshTokenCookie(res, refreshToken);

      return ApiResponse.success(res, 'Access token refreshed successfully', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const userId = req.user?.id;
      if (userId) {
        await AuthService.logout(userId);
      }

      clearRefreshTokenCookie(res);

      return ApiResponse.success(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return ApiResponse.success(res, 'Profile fetched successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      let avatar = req.body.avatar;
      if (req.file) {
        avatar = `/uploads/avatars/${req.file.filename}`;
      }

      const { name, bio, currentPassword, newPassword } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user.id, {
        name,
        bio,
        avatar,
        currentPassword,
        newPassword,
      });

      return ApiResponse.success(res, 'Profile updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}

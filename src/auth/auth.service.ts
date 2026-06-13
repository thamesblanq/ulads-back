import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { db } from '@/config/database';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Fetch user. We use findByEmail from UsersService.
    const user = await this.usersService.findByEmail(email);

    // 2. Defensive Check: Ensure user exists AND has a password hash.
    // If the record exists but has no hash (or is empty), prevent the crash.
    if (
      !user ||
      !user.password_hash ||
      typeof user.password_hash !== 'string'
    ) {
      console.error(
        `Login failed: User ${email} has no password_hash or does not exist.`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verify the password using Argon2
    try {
      const isPasswordValid = await argon2.verify(user.password_hash, password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      console.error('Argon2 verification error:', error);
      throw new InternalServerErrorException('Authentication processing error');
    }

    // 4. Generate the JWT Payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      is_profile_complete: user.is_profile_complete,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_profile_complete: user.is_profile_complete,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If that email exists in our system, a reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + 1);

    try {
      await db.query(
        `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
        [resetToken, expireTime, user.id],
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'ULADS Password Reset Request',
        html: `
          <h3>Password Reset</h3>
          <p>You requested to reset your password. Click the link below:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link expires in 1 hour.</p>
        `,
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new InternalServerErrorException(
        'Could not process password reset request.',
      );
    }

    return {
      message:
        'If that email exists in our system, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const query = `
      SELECT id FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await db.query(query, [token]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    const hashedPassword = await argon2.hash(newPassword);

    try {
      await db.query(
        `UPDATE users 
         SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
         WHERE id = $2`,
        [hashedPassword, user.id],
      );
    } catch (error) {
      console.error('Reset password update error:', error);
      throw new InternalServerErrorException('Could not update password.');
    }

    return { message: 'Password has been successfully reset' };
  }
}

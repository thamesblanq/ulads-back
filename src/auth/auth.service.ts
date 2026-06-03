import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // Initialize Nodemailer with your .env variables
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

    // 1. Check if user exists (using your raw SQL service)
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify the password using Argon2
    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate the JWT Payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      is_profile_complete: user.is_profile_complete,
    };

    // 4. Return the token and user data
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

    // Security Best Practice: Don't throw an error if the email doesn't exist.
    // Just return a success message so hackers can't use this route to guess registered emails.
    if (!user) {
      return {
        message:
          'If that email exists in our system, a reset link has been sent.',
      };
    }

    // 1. Generate a random 32-character hex token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Set expiration to 1 hour from now
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + 1);

    // 3. Save the token and expiration to the database
    await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [resetToken, expireTime, user.id],
    );

    // 4. Send the email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'ULADS Password Reset Request',
      html: `
        <h3>Password Reset</h3>
        <p>You requested to reset your password. Click the link below to set a new one:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return {
      message:
        'If that email exists in our system, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Find the user with this token, ensuring it hasn't expired yet
    const query = `
      SELECT * FROM users 
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await db.query(query, [token]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    // 2. Hash the new password
    const hashedPassword = await argon2.hash(newPassword);

    // 3. Update the password and instantly nullify the reset token so it can't be used again
    await db.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id],
    );

    return { message: 'Password has been successfully reset' };
  }
}

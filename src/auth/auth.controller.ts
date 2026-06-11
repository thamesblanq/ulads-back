import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Returns a success message and sets an HttpOnly JWT cookie.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Get the token from your service
    const { access_token } = await this.authService.login(loginDto);

    // 2. Attach the token as an HttpOnly cookie
    res.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // 3. Return the success message
    return { message: 'Logged in successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate password recovery flow via email' })
  @ApiResponse({
    status: 200,
    description:
      'If the email exists, a token-bearing recovery link is dispatched.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password using validation token' })
  @ApiResponse({ status: 200, description: 'Password successfully modified.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired validation token.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.new_password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out user and clear authentication cookie' })
  @ApiResponse({
    status: 200,
    description: 'Successfully cleared the JWT cookie and logged the user out.',
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    // This tells the browser to instantly delete the "jwt" cookie
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }
}

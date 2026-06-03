import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication') // Group name in UI
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Returns a valid JWT access token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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
}

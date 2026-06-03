import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The unique 32-character hex token sent via email',
    example: '4a7b3c299f1a2b3c4d5e6f7a8b9c0d1e',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'The new account password',
    example: 'mybrandnewsecurepassword2026',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  new_password!: string;
}

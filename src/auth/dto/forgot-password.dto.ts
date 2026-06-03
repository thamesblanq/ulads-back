import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description:
      'The registered email address to receive the password recovery token',
    example: 'student@ulads.edu',
  })
  @IsEmail()
  email!: string;
}

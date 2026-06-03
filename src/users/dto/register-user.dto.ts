import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'The official email address of the student/member',
    example: 'student@ulads.edu',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'A secure account password',
    example: 'securepassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

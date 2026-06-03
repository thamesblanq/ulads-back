import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered user account email',
    example: 'student@ulads.edu',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password string',
    example: 'securepassword123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

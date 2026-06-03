import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CompleteProfileDto {
  @ApiProperty({
    description: 'The official full name of the member',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({
    description: 'The academic level of the member',
    example: 200,
  })
  @IsInt()
  level!: number;

  @ApiProperty({
    description: 'Expected undergraduate graduation year',
    example: 2027,
  })
  @IsInt()
  graduation_year!: number;
}

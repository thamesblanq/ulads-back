import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The full name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'The current academic level',
    example: 300,
  })
  @IsInt()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({
    description: 'The expected graduation year',
    example: 2027,
  })
  @IsInt()
  @IsOptional()
  graduation_year?: number;
}

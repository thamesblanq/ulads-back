import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ example: 'Head and Neck Anatomy Past Questions' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'ANAT 201' })
  @IsString()
  @IsNotEmpty()
  course_code!: string;

  @ApiProperty({ example: '200L' })
  @IsString()
  @IsNotEmpty()
  class_level!: string;

  @ApiProperty({ example: 'https://drive.google.com/drive/folders/xyz123' })
  @IsUrl()
  @IsNotEmpty()
  drive_url!: string;
}

import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    example: 'Urgent: Exam Timetable Adjustments',
    description: 'The title of the notice',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example:
      'Please note that the 400L surgery exams have been shifted to Monday...',
    description: 'Main notice body text',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    example: 'Academic',
    description: 'Category classification',
    required: false,
    default: 'General',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    example: false,
    description:
      'Flags whether this notification demands high-priority rendering',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_urgent?: boolean;
}

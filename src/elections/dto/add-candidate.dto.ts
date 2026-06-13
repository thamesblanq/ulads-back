import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCandidateDto {
  @ApiProperty({ description: 'The UUID of the student running for office' })
  @IsUUID()
  @IsNotEmpty()
  user_id!: string;

  @ApiProperty({ example: 'President' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiProperty({ required: false, description: 'Optional campaign text' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  manifesto?: string;

  @ApiProperty({
    required: false,
    description: 'The hosted image URL string of the candidate',
  })
  @IsString() // 👈 Verifies it is a valid web link format
  @IsOptional()
  image_url?: string;
}

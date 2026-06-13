import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateElectionDto {
  @ApiProperty({ example: 'ULADS 2026 Executive Election' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: '2026-06-15T08:00:00Z',
    description: 'ISO 8601 Date String',
  })
  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @ApiProperty({ example: '2026-06-16T18:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  end_time!: string;
}

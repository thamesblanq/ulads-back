import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleStatusDto {
  @ApiProperty({
    example: true,
    description: 'Set to true to open the election, false to close it',
  })
  @IsBoolean()
  @IsNotEmpty()
  is_active!: boolean;
}

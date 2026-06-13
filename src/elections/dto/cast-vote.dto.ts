import { IsNotEmpty, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CastVoteDto {
  @ApiProperty({ description: 'The UUID of the active election' })
  @IsUUID()
  @IsNotEmpty()
  election_id!: string;

  @ApiProperty({ description: 'The UUID of the chosen candidate' })
  @IsUUID()
  @IsNotEmpty()
  candidate_id!: string;

  @ApiProperty({ example: 'President' })
  @IsString()
  @IsNotEmpty()
  position!: string;
}

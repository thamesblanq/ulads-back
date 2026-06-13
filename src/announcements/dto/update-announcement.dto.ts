import { PartialType } from '@nestjs/swagger';
import { CreateAnnouncementDto } from './create-announcement.dto';

// PartialType inherits all validation rules from CreateAnnouncementDto
// but makes every field optional automatically!
export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

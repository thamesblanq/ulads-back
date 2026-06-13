import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AnnouncementsService, AnnouncementRow } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

interface AuthenticatedRequest extends Express.Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard) // 👈 Every route in this module requires being logged in
@ApiBearerAuth('JWT-auth')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // 👈 Strictly locked down to Executives
  @ApiOperation({
    summary: 'Publish a new official announcement (Executives only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Announcement successfully created.',
  })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateAnnouncementDto,
  ) {
    const executiveId = req.user.sub;
    return this.announcementsService.create(executiveId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve the active notice board feed (All members)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns an array of announcements with executive author details.',
  })
  findAll(): Promise<AnnouncementRow[]> {
    return this.announcementsService.findAll();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Strictly locked down to Executives
  @ApiOperation({
    summary: 'Modify an existing official announcement (Executives only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Announcement not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // 👈 Strictly locked down to Executives
  @ApiOperation({
    summary: 'Remove an announcement from the board (Executives only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Announcement removed successfully.',
  })
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}

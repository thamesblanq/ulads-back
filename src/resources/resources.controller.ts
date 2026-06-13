import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@ApiTags('Academic Resources')
@Controller('resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Add a new Google Drive resource link (Executives only)',
  })
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  // Add Patch to your @nestjs/common imports
  // import { UpdateResourceDto } from './dto/update-resource.dto';

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Update an existing Google Drive resource link (Executives only)',
  })
  @ApiResponse({ status: 200, description: 'Resource successfully updated.' })
  @ApiResponse({ status: 404, description: 'Resource not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Fetch academic resources' })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Filter by class level (e.g., 100L)',
  })
  findAll(@Query('level') level?: string) {
    return this.resourcesService.findAll(level);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Remove a resource link (Executives only)' })
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}

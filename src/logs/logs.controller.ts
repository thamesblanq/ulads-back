import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
import { LogsService } from './logs.service';

@ApiTags('System Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
@ApiBearerAuth('JWT-auth')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch paginated system audit logs' })
  @ApiResponse({
    status: 200,
    description: 'Returns an object with data array and meta object.',
  })
  getRecentLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10', // 👈 Defaulting to 10 per page
  ) {
    return this.logsService.findPaginated(+page, +limit);
  }
}

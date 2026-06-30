import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
import { LogsService } from './logs.service';

@ApiTags('System Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
@ApiBearerAuth('JWT-auth')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch cursor-paginated system audit logs' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of logs to return (default: 10)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Base64 encoded cursor string for fetching the next page',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns an object with data array and meta object (containing nextCursor).',
  })
  getRecentLogs(
    @Query('limit') limit: string = '10',
    @Query('cursor') cursor?: string, // 👈 Optional cursor string
  ) {
    // 1. Convert limit to number (+)
    // 2. Pass the cursor exactly as it came in (or undefined if it's the first page)
    return this.logsService.findPaginated(+limit, cursor);
  }
}

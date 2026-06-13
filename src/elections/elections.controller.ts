import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  Param,
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
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { AddCandidateDto } from './dto/add-candidate.dto';
import { ToggleStatusDto } from './dto/toggle-status.dto';

interface AuthenticatedRequest extends Express.Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('Elections')
@Controller('elections')
@UseGuards(JwtAuthGuard) // Every route requires authentication
@ApiBearerAuth('JWT-auth')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new election (Admin/Superadmin only)' })
  @ApiResponse({ status: 201, description: 'Election successfully scheduled.' })
  createElection(@Body() dto: CreateElectionDto) {
    return this.electionsService.createElection(dto);
  }

  @Get('all') // Changed to /elections/all
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Fetch all elections (Admin/Superadmin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of all elections.',
  })
  findAll() {
    // This calls the method you already wrote in your ElectionsService!
    return this.electionsService.getAllElections();
  }

  @Get('active')
  @ApiOperation({ summary: 'Fetch all currently open elections' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of active elections.',
  })
  getActiveElections() {
    return this.electionsService.getActiveElections();
  }

  @Post('vote')
  @ApiOperation({ summary: 'Cast a secure ballot for a specific candidate' })
  @ApiResponse({ status: 201, description: 'Vote successfully recorded.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: User has already voted for this position.',
  })
  castVote(@Request() req: AuthenticatedRequest, @Body() dto: CastVoteDto) {
    const voterId = req.user.sub;
    return this.electionsService.castVote(voterId, dto);
  }

  // ==========================================
  // ADMIN: Add Candidate
  // ==========================================
  @Post(':id/candidates')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Add a candidate to an election (Admin only)' })
  addCandidate(@Param('id') electionId: string, @Body() dto: AddCandidateDto) {
    return this.electionsService.addCandidate(electionId, dto);
  }

  // ==========================================
  // ADMIN: Toggle Status
  // ==========================================
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Open or close voting for an election (Admin only)',
  })
  toggleStatus(@Param('id') electionId: string, @Body() dto: ToggleStatusDto) {
    return this.electionsService.toggleElectionStatus(
      electionId,
      dto.is_active,
    );
  }

  // ==========================================
  // PUBLIC: View Results
  // ==========================================
  @Get(':id/results')
  @ApiOperation({ summary: 'View tallied results for an election' })
  @ApiResponse({
    status: 200,
    description: 'Returns vote counts grouped by candidate and position.',
  })
  getResults(@Param('id') electionId: string) {
    return this.electionsService.getElectionResults(electionId);
  }
}

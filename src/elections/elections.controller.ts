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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new election' })
  createElection(@Body() dto: CreateElectionDto) {
    return this.electionsService.createElection(dto);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Fetch all elections' })
  findAll() {
    return this.electionsService.getAllElections();
  }

  @Get('active')
  @ApiOperation({ summary: 'Fetch all currently open elections' })
  getActiveElections() {
    return this.electionsService.getActiveElections();
  }

  @Get(':id/has-voted')
  @ApiOperation({ summary: 'Check positions the user has voted for' })
  hasUserVoted(
    @Request() req: AuthenticatedRequest,
    @Param('id') electionId: string,
  ) {
    const voterId = req.user.sub;
    return this.electionsService.hasUserVoted(voterId, electionId);
  }

  @Post('vote')
  @ApiOperation({ summary: 'Cast a secure ballot' })
  @ApiResponse({ status: 201, description: 'Vote recorded.' })
  @ApiResponse({ status: 409, description: 'Already voted for this position.' })
  castVote(@Request() req: AuthenticatedRequest, @Body() dto: CastVoteDto) {
    return this.electionsService.castVote(req.user.sub, dto);
  }

  @Post(':id/candidates')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  addCandidate(@Param('id') electionId: string, @Body() dto: AddCandidateDto) {
    return this.electionsService.addCandidate(electionId, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  toggleStatus(@Param('id') electionId: string, @Body() dto: ToggleStatusDto) {
    return this.electionsService.toggleElectionStatus(
      electionId,
      dto.is_active,
    );
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'View tallied results' })
  getResults(@Param('id') electionId: string) {
    return this.electionsService.getElectionResults(electionId);
  }
}

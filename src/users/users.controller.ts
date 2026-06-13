import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

// --- Security Imports ---
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ====================================================================
  // PUBLIC ROUTES (No Token Required)
  // ====================================================================

  @Post()
  @ApiOperation({ summary: 'Register an initial new member account' })
  @ApiResponse({
    status: 201,
    description: 'User record registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failures or duplicate email.',
  })
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.create(registerUserDto);
  }

  // ====================================================================
  // TIER 1: STANDARD USERS (Authenticated)
  // Note: Static paths ('me', 'search-by-email') MUST be above '/:id'
  // ====================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('complete-profile')
  @ApiOperation({ summary: 'Populate essential profile metadata' })
  completeProfile(
    @Request() req,
    @Body() completeProfileDto: CompleteProfileDto,
  ) {
    const userId = req.user.sub as string;
    return this.usersService.completeProfile(userId, completeProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Fetch the active user profile' })
  getProfile(@Request() req) {
    const userId = req.user.sub as string;
    return this.usersService.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('me')
  @ApiOperation({ summary: 'Perform a partial update on active profile' })
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub as string;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('me')
  @ApiOperation({ summary: 'Flag active user profile state as inactive' })
  remove(@Request() req) {
    const userId = req.user.sub as string;
    return this.usersService.remove(userId);
  }

  // ====================================================================
  // TIER 2: ADMINS & SUPERADMINS (Specific routes moved above :id)
  // ====================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get('search-by-email')
  @ApiOperation({ summary: 'Find a user ID by their email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user object.' })
  findByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'Retrieve all registered member summaries' })
  findAll() {
    return this.usersService.findAll();
  }

  // ====================================================================
  // DYNAMIC ROUTES (Must be last)
  // ====================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({ summary: 'Fetch user public metadata by profile UUID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ====================================================================
  // TIER 3: SUPERADMIN ONLY
  // ====================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Permanently wipe a user from the database' })
  hardDelete(@Param('id') id: string) {
    return { message: `Superadmin authorized: User ${id} permanently wiped.` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/role')
  @ApiOperation({ summary: 'Change a user account role' })
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.usersService.updateRole(id, role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Shadowban or restore a user account' })
  toggleSuspend(
    @Param('id') id: string,
    @Body('is_suspended') isSuspended: boolean,
  ) {
    return this.usersService.toggleSuspend(id, isSuspended);
  }
}

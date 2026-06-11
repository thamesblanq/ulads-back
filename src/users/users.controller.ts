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

@ApiTags('Users') // Group name in UI
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
  // TIER 1: STANDARD USERS (Any authenticated member)
  // ====================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('complete-profile')
  @ApiOperation({ summary: 'Populate essential profile metadata' })
  @ApiResponse({ status: 200, description: 'Profile configured successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or malformed Authorization token.',
  })
  completeProfile(
    @Request() req,
    @Body() completeProfileDto: CompleteProfileDto,
  ) {
    const userId = req.user.sub as string;
    return this.usersService.completeProfile(userId, completeProfileDto);
  }

  // 👇 Add this "me" route specifically ABOVE the ":id" route
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Fetch the active user profile' })
  @ApiResponse({ status: 200, description: 'Returns the current user.' })
  getProfile(@Request() req) {
    // We grab the secure UUID from the decrypted JWT cookie
    const userId = req.user.sub as string;

    // We fetch that specific user from the database
    return this.usersService.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({
    summary: 'Fetch user public metadata parameters by profile UUID',
  })
  @ApiResponse({ status: 200, description: 'Target user model.' })
  @ApiResponse({
    status: 404,
    description: 'No profile matching provided UUID found.',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('me')
  @ApiOperation({
    summary: 'Perform a partial field configuration update on active profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Target record attributes modified successfully.',
  })
  @ApiResponse({ status: 401, description: 'Token validation failure.' })
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub as string;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('me')
  @ApiOperation({ summary: 'Flag active user profile state as inactive' })
  @ApiResponse({
    status: 200,
    description: 'Profile deactivated successfully.',
  })
  @ApiResponse({ status: 401, description: 'Token validation failure.' })
  remove(@Request() req) {
    const userId = req.user.sub as string;
    return this.usersService.remove(userId);
  }

  // ====================================================================
  // TIER 2: ADMINS & SUPERADMINS
  // ====================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Both roles are allowed
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({
    summary: 'Retrieve all registered member summaries (Admin/Superadmin only)',
  })
  @ApiResponse({ status: 200, description: 'Array of user objects.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Insufficient permissions.',
  })
  findAll() {
    return this.usersService.findAll();
  }

  // ====================================================================
  // TIER 3: SUPERADMIN ONLY
  // ====================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN) // Only Superadmin is allowed
  @ApiBearerAuth('JWT-auth')
  @Delete(':id/hard-delete')
  @ApiOperation({
    summary: 'Permanently wipe a user from the database (Superadmin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User permanently deleted.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Requires Superadmin role.',
  })
  hardDelete(@Param('id') id: string) {
    // Note: You can wire this up to a hard-delete method in your UsersService later.
    // For now, it will return a success message to prove the guard works.
    return { message: `Superadmin authorized: User ${id} permanently wiped.` };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/role')
  @ApiOperation({ summary: 'Change a user account role (Superadmin only)' })
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    // Note: You will need to add this method to your UsersService
    return this.usersService.updateRole(id, role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Shadowban or restore a user account (Superadmin only)',
  })
  toggleSuspend(
    @Param('id') id: string,
    @Body('is_suspended') isSuspended: boolean,
  ) {
    // Note: You will need to add this method to your UsersService
    return this.usersService.toggleSuspend(id, isSuspended);
  }
}

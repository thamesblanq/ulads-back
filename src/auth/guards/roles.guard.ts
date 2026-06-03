import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the roles required for this specific route
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. If no roles are required, let them through
    if (!requiredRoles) {
      return true;
    }

    // 3. Grab the decoded user object from Passport (your JWT)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check if the user's role exists inside the requiredRoles array
    return requiredRoles.some((role) => user?.role === role);
  }
}

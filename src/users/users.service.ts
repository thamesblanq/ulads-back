import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { db } from '@/config/database';
import * as argon2 from 'argon2';
import { UserRow } from '../../types';

@Injectable()
export class UsersService {
  // 1. Initial Registration (Email/Password only)
  async create(dto: RegisterUserDto) {
    const { email, password } = dto;

    try {
      // Hash the password before saving
      const hashedPassword = await argon2.hash(password);

      const query = `
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) 
        RETURNING id, email, role, is_profile_complete, created_at;
      `;

      const result = await db.query<UserRow>(query, [email, hashedPassword]);
      return result.rows[0]; // Returns the user without the password hash
    } catch (error: any) {
      // Postgres error code for unique constraint violation
      if (error.code === '23505') {
        throw new ConflictException('A user with this email already exists');
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  // 2. Used by your AuthStrategy during Login
  // In users.service.ts
  async findByEmail(email: string) {
    // Check if the query is selecting the hash!
    const query = `SELECT id, email, full_name, role, password_hash, is_profile_complete FROM users WHERE email = $1`;
    const result = await db.query<UserRow>(query, [email.toLowerCase()]);

    console.log('Database result for email:', email);
    console.log('User found:', result.rows.length > 0);

    if (result.rows.length === 0) {
      throw new NotFoundException(`No user found with email: ${email}`);
    }

    const user = result.rows[0];
    console.log('Hash present in result:', !!user.password_hash);

    return user;
  }

  // 3. The "Complete Profile" action
  async completeProfile(userId: string, dto: CompleteProfileDto) {
    const { full_name, level, graduation_year } = dto;

    const query = `
      UPDATE users 
      SET full_name = $1, 
          level = $2, 
          graduation_year = $3, 
          is_profile_complete = TRUE, 
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, full_name, level, graduation_year, is_profile_complete;
    `;

    const result = await db.query<UserRow>(query, [
      full_name,
      level,
      graduation_year,
      userId,
    ]);
    return result.rows[0];
  }

  async findOne(id: string) {
    const query = `SELECT id, email, full_name, level, graduation_year, role, is_profile_complete FROM users WHERE id = $1 AND is_active = TRUE`;
    const result = await db.query<UserRow>(query, [id]);
    return result.rows[0];
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    // Dynamically build the SQL string based on what fields are provided
    for (const [key, value] of Object.entries(updateUserDto)) {
      if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    // If no fields were passed to update, just return the existing user
    if (fields.length === 0) {
      return this.findOne(id);
    }

    // Add the updated_at timestamp and the ID constraint to the arrays
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const idIndex = index; // The index position of the ID in the values array

    const query = `
    UPDATE users 
    SET ${fields.join(', ')} 
    WHERE id = $${idIndex}
    RETURNING id, email, full_name, level, graduation_year, role, is_profile_complete;
    `;

    try {
      const result = await db.query<UserRow>(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not update user details');
    }
  }

  async findAll() {
    const query = `
      SELECT id, email, full_name, level, graduation_year, role, is_profile_complete, created_at,
             (is_active = FALSE) as "isSuspended" 
      FROM users 
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  }

  //soft delete
  async remove(id: string) {
    const query = `
    UPDATE users 
    SET is_active = FALSE, updated_at = NOW() 
    WHERE id = $1 
    RETURNING id;
  `;

    try {
      const result = await db.query<UserRow>(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return { message: `User account successfully deactivated` };
    } catch (error) {
      // Logging fixes the ESLint 'unused variable' warning and helps with debugging
      console.error('Error deactivating user:', error);
      throw new InternalServerErrorException(
        'Could not deactivate user account',
      );
    }
  }

  // ====================================================================
  // SUPERADMIN ACTIONS
  // ====================================================================

  async updateRole(id: string, role: string) {
    const query = `
      UPDATE users 
      SET role = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, email, role;
    `;

    try {
      // Ensure role is perfectly lowercase before saving
      const result = await db.query<UserRow>(query, [role.toLowerCase(), id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating role:', error);
      throw new InternalServerErrorException('Could not update user role');
    }
  }

  async toggleSuspend(id: string, isSuspended: boolean) {
    // If they are suspended, is_active is FALSE. If restored, is_active is TRUE.
    const isActive = !isSuspended;

    const query = `
      UPDATE users 
      SET is_active = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, email, is_active;
    `;

    try {
      const result = await db.query<UserRow>(query, [isActive, id]);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error toggling suspension:', error);
      throw new InternalServerErrorException(
        'Could not update suspension status',
      );
    }
  }

  //hard delete, gives problem down the line

  /*   async remove(id: string) {
    const query = `
    DELETE FROM users 
    WHERE id = $1
    RETURNING id;
  `;

    try {
      const result = await db.query(query, [id]);

      // If result.rows is empty, it means no row matched that ID
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return { message: `User account successfully deleted` };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not delete user account');
    }
  } */
}

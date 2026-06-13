import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/config/database';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  // Create a new Resource Link
  async create(dto: CreateResourceDto) {
    const query = `
      INSERT INTO resources (title, course_code, class_level, drive_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    try {
      const result = await db.query(query, [
        dto.title,
        dto.course_code,
        dto.class_level,
        dto.drive_url,
      ]);
      return result.rows[0];
    } catch (error: unknown) {
      console.error('Error adding resource:', error);
      throw new InternalServerErrorException('Could not add resource link.');
    }
  }

  // Update an existing resource link
  async update(id: string, dto: UpdateResourceDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    // Dynamically build the SQL string for partial updates
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new InternalServerErrorException('No fields provided for update');
    }

    // Always bump the updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const idIndex = index;

    const query = `
      UPDATE resources 
      SET ${fields.join(', ')} 
      WHERE id = $${idIndex}
      RETURNING *;
    `;

    try {
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Database error updating resource:', error);
      throw new InternalServerErrorException('Could not update resource link.');
    }
  }

  // Fetch all resources (Optionally filtered by level)
  async findAll(level?: string) {
    let query = `SELECT * FROM resources ORDER BY class_level ASC, created_at DESC;`;
    const params: string[] = [];

    if (level) {
      query = `SELECT * FROM resources WHERE class_level = $1 ORDER BY created_at DESC;`;
      params.push(level);
    }

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (error: unknown) {
      console.error('Error fetching resources:', error);
      throw new InternalServerErrorException('Could not fetch resources.');
    }
  }

  // Delete a resource link
  async remove(id: string) {
    const query = `DELETE FROM resources WHERE id = $1 RETURNING id;`;
    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }
      return { message: 'Resource link deleted successfully' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Could not delete resource.');
    }
  }
}

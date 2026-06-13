import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/config/database';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: string;
  is_urgent: boolean;
  created_at: Date;
  author_name: string | null;
  author_role: string | null;
}

@Injectable()
export class AnnouncementsService {
  // 1. Create a new Announcement linked to the author
  async create(authorId: string, dto: CreateAnnouncementDto) {
    const { title, content, category = 'General', is_urgent = false } = dto;
    const query = `
      INSERT INTO announcements (title, content, category, is_urgent, author_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, category, is_urgent, created_at;
    `;

    try {
      const result = await db.query(query, [
        title,
        content,
        category,
        is_urgent,
        authorId,
      ]);
      return result.rows[0];
    } catch (error: unknown) {
      console.error('Database error creating announcement:', error);
      throw new InternalServerErrorException('Could not publish announcement.');
    }
  }

  // 2. Fetch all Announcements with author relations
  async findAll() {
    const query = `
      SELECT 
        a.id, 
        a.title, 
        a.content, 
        a.category, 
        a.is_urgent, 
        a.created_at,
        u.full_name AS author_name,
        u.role AS author_role
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC;
    `;

    try {
      const result = await db.query<AnnouncementRow>(query);
      return result.rows;
    } catch (error: unknown) {
      console.error('Database error fetching announcements:', error);
      throw new InternalServerErrorException(
        'Could not retrieve announcements.',
      );
    }
  }

  // Update an existing Announcement
  async update(id: string, dto: UpdateAnnouncementDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    // Dynamically build the SQL string based on what fields were passed
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

    // Always update the timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const idIndex = index; // The parameter index for the WHERE clause

    const query = `
      UPDATE announcements 
      SET ${fields.join(', ')} 
      WHERE id = $${idIndex}
      RETURNING id, title, content, category, is_urgent, updated_at;
    `;

    try {
      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundException(`Announcement with ID ${id} not found`);
      }

      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Database error updating announcement:', error);
      throw new InternalServerErrorException('Could not update announcement.');
    }
  }

  // 3. Delete an Announcement
  async remove(id: string) {
    const query = `DELETE FROM announcements WHERE id = $1 RETURNING id;`;

    try {
      const result = await db.query(query, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundException(`Announcement with ID ${id} not found`);
      }
      return { message: 'Announcement deleted successfully' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Database error deleting announcement:', error);
      throw new InternalServerErrorException('Could not remove announcement.');
    }
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '@/config/database';

@Injectable()
export class LogsService {
  async findPaginated(page: number, limit: number) {
    // Calculate how many rows to skip based on the current page
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT 
        a.id, 
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') AS date, 
        COALESCE(u.email, 'Unauthenticated / Guest') AS email, 
        COALESCE(u.role, 'guest') AS role, 
        a.url AS route, 
        a.method AS action, 
        a.status_code AS status 
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC 
      LIMIT $1 OFFSET $2;
    `;

    // Extremely fast query to get the total number of logs
    const countQuery = `SELECT COUNT(*) FROM activity_logs;`;

    try {
      // Run both queries concurrently for maximum speed
      const [dataResult, countResult] = await Promise.all([
        db.query(dataQuery, [limit, offset]),
        db.query(countQuery),
      ]);

      const total = parseInt(String(countResult.rows[0].count), 10);
      const lastPage = Math.ceil(total / limit);

      // Return a clean pagination object
      return {
        data: dataResult.rows,
        meta: {
          total,
          currentPage: page,
          lastPage,
        },
      };
    } catch (error) {
      console.error('Error fetching paginated logs:', error);
      throw new InternalServerErrorException('Could not fetch system logs');
    }
  }
}

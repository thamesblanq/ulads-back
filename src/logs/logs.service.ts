import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { db } from '@/config/database';

// 1. Define the exact shape of the row coming from PostgreSQL
interface ActivityLogRow {
  id: string;
  raw_created_at: Date | string; // Postgres driver usually returns Date objects
  date: string;
  email: string;
  role: string;
  route: string;
  action: string;
  status: number;
}

@Injectable()
export class LogsService {
  async findPaginated(limit: number, cursor?: string) {
    // 2. Explicitly type the cursor variables
    let cursorDate: string | null = null;
    let cursorId: string | null = null;

    if (cursor) {
      try {
        const decodedString = Buffer.from(cursor, 'base64').toString('utf-8');
        const [datePart, idPart] = decodedString.split('|');
        cursorDate = datePart;
        cursorId = idPart;
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException('Invalid cursor format.');
      }
    }

    const fetchLimit = limit + 1;

    // 3. Strongly type the params array
    const params: (number | string)[] = [fetchLimit];
    let whereClause = '';

    if (cursorDate && cursorId) {
      whereClause = `WHERE (a.created_at, a.id) < ($2, $3)`;
      params.push(cursorDate, cursorId);
    }

    const dataQuery = `
      SELECT 
        a.id, 
        a.created_at AS raw_created_at, 
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI:SS') AS date, 
        COALESCE(u.email, 'Unauthenticated / Guest') AS email, 
        COALESCE(u.role, 'guest') AS role, 
        a.url AS route, 
        a.method AS action, 
        a.status_code AS status 
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC, a.id DESC 
      LIMIT $1;
    `;

    try {
      const dataResult = await db.query(dataQuery, params);

      // 4. Cast the Postgres result into our strongly-typed interface
      const rows = dataResult.rows as ActivityLogRow[];

      const hasNextPage = rows.length > limit;

      if (hasNextPage) {
        rows.pop();
      }

      let nextCursor: string | null = null;
      if (rows.length > 0) {
        const lastItem = rows[rows.length - 1];
        // 5. TS now knows lastItem is an ActivityLogRow, so raw_created_at is safe!
        const cursorString = `${new Date(lastItem.raw_created_at).toISOString()}|${lastItem.id}`;
        nextCursor = Buffer.from(cursorString).toString('base64');
      }

      // 6. Explicitly build the object to satisfy the "unused variable" linting error
      const sanitizedData = rows.map((row) => ({
        id: row.id,
        date: row.date,
        email: row.email,
        role: row.role,
        route: row.route,
        action: row.action,
        status: row.status,
      }));

      return {
        data: sanitizedData,
        meta: {
          nextCursor: hasNextPage ? nextCursor : null,
          hasNextPage,
        },
      };
    } catch (error) {
      console.error('Error fetching cursor paginated logs:', error);
      throw new InternalServerErrorException('Could not fetch system logs');
    }
  }
}

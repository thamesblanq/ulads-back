import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/config/database';
import { CreateElectionDto } from './dto/create-election.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { AddCandidateDto } from './dto/add-candidate.dto';

// Define what Postgres returns so TypeScript knows start_time is a Date
interface ElectionRow {
  is_active: boolean;
  start_time: Date;
  end_time: Date;
}

@Injectable()
export class ElectionsService {
  // ==========================================
  // ADMIN: Create a new Election
  // ==========================================
  async createElection(dto: CreateElectionDto) {
    const query = `
      INSERT INTO elections (title, start_time, end_time, is_active)
      VALUES ($1, $2, $3, false)
      RETURNING *;
    `;
    try {
      const result = await db.query(query, [
        dto.title,
        dto.start_time,
        dto.end_time,
      ]);
      return result.rows[0];
    } catch (error: unknown) {
      console.error('Error creating election:', error);
      throw new InternalServerErrorException('Could not create election.');
    }
  }

  async hasUserVoted(voterId: string, electionId: string) {
    const query = `SELECT position FROM votes WHERE voter_id = $1 AND election_id = $2`;
    const result = await db.query(query, [voterId, electionId]);
    // Returns an array of positions the user has voted in (e.g., ['President', 'Secretary'])
    return result.rows.map((row) => row.position);
  }

  // ==========================================
  // PUBLIC: Get active elections with Candidates
  // ==========================================
  async getActiveElections() {
    const query = `
      SELECT 
        e.id AS election_id,
        e.title AS election_title,
        e.end_time,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'name', u.full_name,
              'position', c.position,
              'imageUrl', COALESCE(c.image_url, '/placeholders/avatar.png'),
              'manifesto', COALESCE(c.manifesto, 'no manifesto was updated'), -- 👈 Safe raw string fallback
              'votes', (SELECT COUNT(*)::int FROM votes v WHERE v.candidate_id = c.id)
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS candidates
      FROM elections e
      LEFT JOIN candidates c ON e.id = c.election_id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE e.is_active = true 
        AND NOW() >= e.start_time 
        AND NOW() <= e.end_time
      GROUP BY e.id, e.title, e.end_time
      ORDER BY e.start_time DESC
      LIMIT 1;
    `;
    try {
      const result = await db.query(query);

      // If there are no open elections, return null safely
      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.election_id,
        title: row.election_title,
        endTime: row.end_time,
        candidates: row.candidates,
      };
    } catch (error: unknown) {
      console.error('Error fetching active compiled elections:', error);
      throw new InternalServerErrorException(
        'Could not fetch active elections.',
      );
    }
  }

  // ADMIN: Get all elections (regardless of active status)
  async getAllElections() {
    const query = `
      SELECT id, title, start_time, end_time, is_active 
      FROM elections 
      ORDER BY start_time DESC;
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error: unknown) {
      console.error('Error fetching all elections:', error);
      throw new InternalServerErrorException('Could not fetch elections list.');
    }
  }

  // ==========================================
  // SECURE TRANSACTION: Cast a Vote
  // ==========================================
  async castVote(voterId: string, dto: CastVoteDto) {
    // 👇 Fixed: db is already the Pool, so we just call connect()
    const client = await db.connect();

    try {
      await client.query('BEGIN'); // 🔒 Start ACID Transaction

      // 1. Verify Election is Active
      const electionCheck = await client.query<ElectionRow>(
        `SELECT is_active, start_time, end_time FROM elections WHERE id = $1`,
        [dto.election_id],
      );

      if (electionCheck.rows.length === 0) {
        throw new NotFoundException('Election not found.');
      }

      const election = electionCheck.rows[0];
      const now = new Date();

      // 👇 Fixed: Postgres driver automatically returns native Date objects!
      if (
        !election.is_active ||
        now < election.start_time ||
        now > election.end_time
      ) {
        throw new BadRequestException(
          'This election is not currently open for voting.',
        );
      }

      // 2. Cast the Vote
      await client.query(
        `INSERT INTO votes (election_id, candidate_id, voter_id, position) 
         VALUES ($1, $2, $3, $4)`,
        [dto.election_id, dto.candidate_id, voterId, dto.position],
      );

      await client.query('COMMIT'); // 🔓 Lock in the vote
      return { message: 'Vote successfully securely recorded!' };
    } catch (error: unknown) {
      await client.query('ROLLBACK'); // ⏪ Undo everything if anything fails

      // Safely check for the Postgres unique constraint violation code (23505)
      if (error instanceof Error && (error as any).code === '23505') {
        throw new ConflictException(
          `You have already cast a vote for the position of ${dto.position}.`,
        );
      }

      // Re-throw known HTTP exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Voting transaction failed:', error);
      throw new InternalServerErrorException(
        'Your vote could not be processed at this time.',
      );
    } finally {
      client.release(); // 🔄 Always release the client back to the pool
    }
  }

  // ==========================================
  // ADMIN: Add Candidate to an Election
  // ==========================================
  // ADMIN: Add Candidate to an Election
  async addCandidate(electionId: string, dto: AddCandidateDto) {
    // 1. Added image_url to the columns
    const query = `
      INSERT INTO candidates (election_id, user_id, position, manifesto, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, position, image_url, created_at;
    `;
    try {
      // 2. Added dto.image_url to the values array
      const result = await db.query(query, [
        electionId,
        dto.user_id,
        dto.position,
        dto.manifesto,
        dto.image_url || '/placeholders/avatar.png', // Fallback if undefined
      ]);
      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).code === '23505') {
        throw new ConflictException(
          'This user is already running for a position in this election.',
        );
      }
      console.error('Error adding candidate:', error);
      throw new InternalServerErrorException('Could not add candidate.');
    }
  }

  // ==========================================
  // ADMIN: Toggle Election Status (Open/Close)
  // ==========================================
  async toggleElectionStatus(electionId: string, isActive: boolean) {
    const query = `
      UPDATE elections 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING id, title, is_active;
    `;
    try {
      const result = await db.query(query, [isActive, electionId]);
      if (result.rows.length === 0) {
        throw new NotFoundException('Election not found.');
      }
      return result.rows[0];
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error toggling election status:', error);
      throw new InternalServerErrorException(
        'Could not update election status.',
      );
    }
  }

  // ==========================================
  // PUBLIC: Get Live Election Results
  // ==========================================
  async getElectionResults(electionId: string) {
    // We use a LEFT JOIN on votes so candidates with 0 votes are still included!
    const query = `
      SELECT 
        c.position,
        u.full_name AS candidate_name,
        u.email AS candidate_email,
        COUNT(v.id)::int AS vote_count
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE c.election_id = $1
      GROUP BY c.id, c.position, u.full_name, u.email
      ORDER BY c.position ASC, vote_count DESC;
    `;
    try {
      const result = await db.query(query, [electionId]);
      return result.rows;
    } catch (error: unknown) {
      console.error('Error fetching results:', error);
      throw new InternalServerErrorException(
        'Could not fetch election results.',
      );
    }
  }
}

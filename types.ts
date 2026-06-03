export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  is_profile_complete: boolean;
  created_at?: Date;
  updated_at?: Date;
}

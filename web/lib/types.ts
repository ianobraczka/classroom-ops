export type UserRole = "teacher" | "student" | "admin";

export type ClassroomStatus = "active" | "archived";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Classroom = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  academic_year: string | null;
  status: ClassroomStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

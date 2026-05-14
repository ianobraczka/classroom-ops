import { z } from "zod";

export const classroomFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000),
  subject: z.string().max(255),
  grade_level: z.string().max(64),
  academic_year: z.string().max(32),
});

export type ClassroomFormValues = z.infer<typeof classroomFormSchema>;

export function emptyClassroomForm(): ClassroomFormValues {
  return {
    name: "",
    description: "",
    subject: "",
    grade_level: "",
    academic_year: "",
  };
}

export function classroomToFormValues(c: {
  name: string;
  description: string | null;
  subject: string | null;
  grade_level: string | null;
  academic_year: string | null;
}): ClassroomFormValues {
  return {
    name: c.name,
    description: c.description ?? "",
    subject: c.subject ?? "",
    grade_level: c.grade_level ?? "",
    academic_year: c.academic_year ?? "",
  };
}

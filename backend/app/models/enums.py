import enum


class UserRole(str, enum.Enum):
    teacher = "teacher"
    student = "student"
    admin = "admin"


class ClassroomStatus(str, enum.Enum):
    active = "active"
    archived = "archived"

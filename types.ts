
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR = 'HR'
}

export enum LeaveStatus {
  PENDING_MANAGER = 'PENDING_MANAGER',
  PENDING_HR = 'PENDING_HR',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string; // Head of department
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  dueDate?: string;
  tasks?: string[]; // Pre-defined tasks for the project
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  managerId?: string; // For hierarchy
  location?: UserLocation;
  phone?: string;
  
  // Organization Links
  departmentId?: string; // Single department
  projectIds?: string[]; // Multiple projects
  
  // Legacy/Display (can be derived from departmentId in UI, keeping for safety)
  jobTitle?: string;
  department?: string; // Kept for fallback display
  hireDate?: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  days: number;
  description: string;
  isActive: boolean;
  color?: string; // For UI decoration
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: string; // Maps to LeaveTypeConfig.name
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  managerComment?: string;
  hrComment?: string;
  createdAt: string;
  attachmentUrl?: string; // For medical certificates
  managerConsent?: boolean; // For remote work
  notifyUserIds?: string[]; // IDs of users to notify
  isUrgent?: boolean;
  approverId?: string; // Explicitly selected manager
}

export interface Payslip {
  id: string;
  userId: string;
  month: string;
  year: number;
  amount: number;
  pdfUrl: string; // Simulated URL
  uploadedAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Company';
  description?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  task: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  description: string;
  status: 'Pending' | 'Approved';
  isBillable: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO String
  checkOutTime?: string; // ISO String
  earlyLogoutReason?: string;
}

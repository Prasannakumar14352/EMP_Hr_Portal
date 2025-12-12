import { User, UserRole, Department, Project, LeaveRequest, AttendanceRecord, TimeEntry, Payslip, Holiday, LeaveTypeConfig, LeaveStatus } from "../types";

// SET TO FALSE TO USE REAL BACKEND API
const USE_MOCK_API = true; 
const API_BASE_URL = "/api"; // Your SQL Server Backend URL

// --- MOCK DATA REPOSITORY ---
// Moved from context.tsx to simulate database storage

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', description: 'Software Development and IT', managerId: 'u2' },
  { id: 'd2', name: 'Human Resources', description: 'People and Culture', managerId: 'u3' },
  { id: 'd3', name: 'Product', description: 'Product Management and Design', managerId: 'u5' },
  { id: 'd4', name: 'Executive', description: 'C-Level Management', managerId: 'u5' },
];

const MOCK_PROJECTS: Project[] = [
  { 
    id: 'pj1', name: 'Website Revamp', description: 'Modernizing the corporate portal', status: 'Active', dueDate: '2024-12-31',
    tasks: ['Development', 'Design', 'Testing', 'Planning', 'Deployment']
  },
  { 
    id: 'pj2', name: 'Mobile App V2', description: 'Adding biometric login', status: 'Active', dueDate: '2024-09-30',
    tasks: ['Frontend', 'Backend API', 'UX Research', 'QA']
  },
  { 
    id: 'pj3', name: 'Q3 Recruitment', description: 'Hiring for sales team', status: 'Completed',
    tasks: ['Sourcing', 'Interviews', 'Onboarding', 'Documentation']
  },
];

const MOCK_USERS: User[] = [
  { 
    id: 'u1', name: 'Alice Employee', email: 'alice@nexus.com', role: UserRole.EMPLOYEE, 
    avatar: 'https://picsum.photos/id/1011/200/200', managerId: 'u2', phone: '+1 555-0101', 
    departmentId: 'd1', projectIds: ['pj1', 'pj2'],
    location: { latitude: 34.0522, longitude: -118.2437, address: 'Los Angeles, CA' },
    jobTitle: 'Senior Frontend Developer', hireDate: '2022-03-15'
  },
  { 
    id: 'u2', name: 'Bob Manager', email: 'bob@nexus.com', role: UserRole.MANAGER, 
    avatar: 'https://picsum.photos/id/1012/200/200', managerId: 'u3', phone: '+1 555-0102', 
    departmentId: 'd1', projectIds: ['pj1'],
    location: { latitude: 40.7128, longitude: -74.0060, address: 'New York, NY' },
    jobTitle: 'Engineering Manager', hireDate: '2020-06-01' 
  },
  { 
    id: 'u3', name: 'Charlie HR', email: 'charlie@nexus.com', role: UserRole.HR, 
    avatar: 'https://picsum.photos/id/1013/200/200', phone: '+1 555-0103', 
    departmentId: 'd2', projectIds: ['pj3'],
    location: { latitude: 51.5074, longitude: -0.1278, address: 'London, UK' },
    jobTitle: 'HR Director', hireDate: '2019-01-10'
  },
  { 
    id: 'u4', name: 'David Dev', email: 'david@nexus.com', role: UserRole.EMPLOYEE, 
    avatar: 'https://picsum.photos/id/1014/200/200', managerId: 'u2', phone: '+1 555-0104', 
    departmentId: 'd3', projectIds: ['pj2'],
    location: { latitude: 37.7749, longitude: -122.4194, address: 'San Francisco, CA' },
    jobTitle: 'Product Owner', hireDate: '2023-01-20'
  },
  { 
    id: 'u5', name: 'Eve Exec', email: 'eve@nexus.com', role: UserRole.MANAGER, 
    avatar: 'https://picsum.photos/id/1015/200/200', phone: '+1 555-0105', 
    departmentId: 'd4', projectIds: [],
    location: { latitude: 48.8566, longitude: 2.3522, address: 'Paris, France' },
    jobTitle: 'VP of Operations', hireDate: '2018-11-05'
  },
];

const INITIAL_LEAVE_TYPES: LeaveTypeConfig[] = [
  { id: 'lt1', name: 'Annual Leave', days: 20, description: 'Standard annual vacation leave', isActive: true, color: 'text-emerald-600' },
  { id: 'lt2', name: 'Compassionate Leave', days: 5, description: 'Leave for family emergencies and bereavement', isActive: true, color: 'text-teal-600' },
  { id: 'lt3', name: 'Loss of Pay', days: 10, description: 'Unpaid leave for personal reasons', isActive: true, color: 'text-rose-600' },
  { id: 'lt4', name: 'Paternity Leave', days: 15, description: 'Leave for new fathers', isActive: true, color: 'text-blue-600' },
  { id: 'lt5', name: 'Sick Leave', days: 12, description: 'Medical and health-related leave', isActive: true, color: 'text-amber-600' },
];

let mockLeaves: LeaveRequest[] = [
    { id: 'l1', userId: 'u1', userName: 'Alice Employee', type: 'Annual Leave', startDate: '2024-06-10', endDate: '2024-06-15', reason: 'Family vacation', status: LeaveStatus.PENDING_MANAGER, createdAt: '2024-05-20' },
    { id: 'l2', userId: 'u1', userName: 'Alice Employee', type: 'Sick Leave', startDate: '2024-05-01', endDate: '2024-05-02', reason: 'Flu', status: LeaveStatus.APPROVED, managerComment: 'Get well soon', hrComment: 'Approved', createdAt: '2024-05-01' }
];

let mockTimeEntries: TimeEntry[] = [
    { id: 'te1', userId: 'u1', projectId: 'pj1', task: 'Development', date: new Date().toISOString().split('T')[0], durationMinutes: 480, description: 'Working on login page', status: 'Pending', isBillable: true },
    { id: 'te2', userId: 'u1', projectId: 'pj2', task: 'Design', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], durationMinutes: 240, description: 'Mockups for new feature', status: 'Approved', isBillable: true },
];

let mockAttendance: AttendanceRecord[] = [];
let mockPayslips: Payslip[] = [
    { id: 'p1', userId: 'u1', month: 'April', year: 2024, amount: 4500, pdfUrl: '#', uploadedAt: '2024-04-25' },
    { id: 'p2', userId: 'u2', month: 'April', year: 2024, amount: 5500, pdfUrl: '#', uploadedAt: '2024-04-25' }
];
let mockHolidays: Holiday[] = [
    { id: 'h1', name: 'New Year', date: '2024-01-01', type: 'Public', description: 'Celebration of the new year' },
    { id: 'h2', name: 'Company Anniversary', date: '2024-08-15', type: 'Company', description: 'Celebrating 10 years of Nexus' },
    { id: 'h3', name: 'Christmas', date: '2024-12-25', type: 'Public', description: 'Christmas Day' }
];

// --- API SERVICE ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // Users
    async fetchUserByEmail(email: string): Promise<User | null> {
        if (USE_MOCK_API) {
            await delay(500);
            return MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        }
        const res = await fetch(`${API_BASE_URL}/users?email=${email}`);
        if (!res.ok) return null;
        return res.json();
    },

    async fetchAllUsers(): Promise<User[]> {
        if (USE_MOCK_API) { await delay(500); return [...MOCK_USERS]; }
        return (await fetch(`${API_BASE_URL}/users`)).json();
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        if (USE_MOCK_API) {
            const idx = MOCK_USERS.findIndex(u => u.id === id);
            if (idx !== -1) MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
            return MOCK_USERS[idx];
        }
        return (await fetch(`${API_BASE_URL}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })).json();
    },

    // Departments
    async fetchDepartments(): Promise<Department[]> {
        if (USE_MOCK_API) return [...MOCK_DEPARTMENTS];
        return (await fetch(`${API_BASE_URL}/departments`)).json();
    },

    async createDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
        if (USE_MOCK_API) {
            const newDept = { ...dept, id: `d-${Date.now()}` };
            MOCK_DEPARTMENTS.push(newDept);
            return newDept;
        }
        return (await fetch(`${API_BASE_URL}/departments`, { method: 'POST', body: JSON.stringify(dept) })).json();
    },

    // Projects
    async fetchProjects(): Promise<Project[]> {
        if (USE_MOCK_API) return [...MOCK_PROJECTS];
        return (await fetch(`${API_BASE_URL}/projects`)).json();
    },

    // Leaves
    async fetchLeaves(): Promise<LeaveRequest[]> {
        if (USE_MOCK_API) { await delay(300); return [...mockLeaves]; }
        return (await fetch(`${API_BASE_URL}/leaves`)).json();
    },

    async createLeave(leave: any): Promise<LeaveRequest> {
        if (USE_MOCK_API) {
            const newLeave = { ...leave, id: `l-${Date.now()}` };
            mockLeaves.push(newLeave);
            return newLeave;
        }
        return (await fetch(`${API_BASE_URL}/leaves`, { method: 'POST', body: JSON.stringify(leave) })).json();
    },

    async updateLeave(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
        if (USE_MOCK_API) {
             const idx = mockLeaves.findIndex(l => l.id === id);
             if (idx !== -1) mockLeaves[idx] = { ...mockLeaves[idx], ...data };
             return mockLeaves[idx];
        }
        return (await fetch(`${API_BASE_URL}/leaves/${id}`, { method: 'PUT', body: JSON.stringify(data) })).json();
    },

    async fetchLeaveTypes(): Promise<LeaveTypeConfig[]> {
        if (USE_MOCK_API) return [...INITIAL_LEAVE_TYPES];
        return (await fetch(`${API_BASE_URL}/leavetypes`)).json();
    },

    // Attendance
    async fetchAttendance(): Promise<AttendanceRecord[]> {
        if (USE_MOCK_API) return [...mockAttendance];
        return (await fetch(`${API_BASE_URL}/attendance`)).json();
    },

    async createAttendance(record: any): Promise<AttendanceRecord> {
        if (USE_MOCK_API) {
            const newRec = { ...record, id: `att-${Date.now()}` };
            mockAttendance.push(newRec);
            return newRec;
        }
        return (await fetch(`${API_BASE_URL}/attendance`, { method: 'POST', body: JSON.stringify(record) })).json();
    },

     async updateAttendance(id: string, data: Partial<AttendanceRecord>): Promise<void> {
        if (USE_MOCK_API) {
             const idx = mockAttendance.findIndex(a => a.id === id);
             if (idx !== -1) mockAttendance[idx] = { ...mockAttendance[idx], ...data };
             return;
        }
        await fetch(`${API_BASE_URL}/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    // Time Logs
    async fetchTimeEntries(): Promise<TimeEntry[]> {
        if (USE_MOCK_API) return [...mockTimeEntries];
        return (await fetch(`${API_BASE_URL}/timelogs`)).json();
    },
    
    async createTimeEntry(entry: any): Promise<TimeEntry> {
        if (USE_MOCK_API) {
            const newEntry = { ...entry, id: `te-${Date.now()}` };
            mockTimeEntries.push(newEntry);
            return newEntry;
        }
        return (await fetch(`${API_BASE_URL}/timelogs`, { method: 'POST', body: JSON.stringify(entry) })).json();
    },

    async deleteTimeEntry(id: string): Promise<void> {
        if(USE_MOCK_API) {
            mockTimeEntries = mockTimeEntries.filter(t => t.id !== id);
            return;
        }
        await fetch(`${API_BASE_URL}/timelogs/${id}`, { method: 'DELETE' });
    },

    // Other
    async fetchHolidays(): Promise<Holiday[]> {
        if (USE_MOCK_API) return [...mockHolidays];
        return (await fetch(`${API_BASE_URL}/holidays`)).json();
    },
    
    async fetchPayslips(): Promise<Payslip[]> {
         if (USE_MOCK_API) return [...mockPayslips];
         return (await fetch(`${API_BASE_URL}/payslips`)).json();
    }
};

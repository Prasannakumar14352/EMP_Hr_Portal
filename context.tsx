import React, { useState, useContext, createContext } from 'react';
import { 
  User, UserRole, LeaveRequest, LeaveStatus, Payslip, Holiday, Notification, LeaveTypeConfig, Department, Project, TimeEntry
} from './types';

// --- Mock Data ---

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

export const MOCK_USERS: User[] = [
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

interface AppContextType {
  users: User[];
  currentUser: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  updateUser: (id: string, data: Partial<User>) => void;
  
  // Organization
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, data: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  
  projects: Project[];
  addProject: (proj: Omit<Project, 'id'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Time Logs
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateTimeEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Leaves
  leaves: LeaveRequest[];
  leaveTypes: LeaveTypeConfig[];
  addLeave: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'userName' | 'userId'>) => void;
  editLeave: (id: string, req: Partial<LeaveRequest>) => void;
  addLeaves: (reqs: LeaveRequest[]) => void;
  updateLeaveStatus: (id: string, status: LeaveStatus, comment?: string) => void;
  
  // Leave Type Management
  addLeaveType: (type: Omit<LeaveTypeConfig, 'id'>) => void;
  updateLeaveType: (id: string, updates: Partial<LeaveTypeConfig>) => void;
  deleteLeaveType: (id: string) => void;

  // Others
  payslips: Payslip[];
  uploadPayslips: (newPayslips: Payslip[]) => void;
  holidays: Holiday[];
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  addHolidays: (newHolidays: Holiday[]) => void;
  deleteHoliday: (id: string) => void;
  notifications: Notification[];
  markAllNotificationsRead: () => void;
  notify: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: 'te1', userId: 'u1', projectId: 'pj1', task: 'Development', date: new Date().toISOString().split('T')[0], durationMinutes: 480, description: 'Working on login page', status: 'Pending', isBillable: true },
    { id: 'te2', userId: 'u1', projectId: 'pj2', task: 'Design', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], durationMinutes: 240, description: 'Mockups for new feature', status: 'Approved', isBillable: true },
  ]);

  // Mock Database
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 'l1', userId: 'u1', userName: 'Alice Employee', type: 'Annual Leave', startDate: '2024-06-10', endDate: '2024-06-15', reason: 'Family vacation', status: LeaveStatus.PENDING_MANAGER, createdAt: '2024-05-20' },
    { id: 'l2', userId: 'u1', userName: 'Alice Employee', type: 'Sick Leave', startDate: '2024-05-01', endDate: '2024-05-02', reason: 'Flu', status: LeaveStatus.APPROVED, managerComment: 'Get well soon', hrComment: 'Approved', createdAt: '2024-05-01' }
  ]);
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>(INITIAL_LEAVE_TYPES);

  const [payslips, setPayslips] = useState<Payslip[]>([
    { id: 'p1', userId: 'u1', month: 'April', year: 2024, amount: 4500, pdfUrl: '#', uploadedAt: '2024-04-25' },
    { id: 'p2', userId: 'u2', month: 'April', year: 2024, amount: 5500, pdfUrl: '#', uploadedAt: '2024-04-25' }
  ]);
  const [holidays, setHolidays] = useState<Holiday[]>([
    { id: 'h1', name: 'New Year', date: '2024-01-01', type: 'Public', description: 'Celebration of the new year' },
    { id: 'h2', name: 'Company Anniversary', date: '2024-08-15', type: 'Company', description: 'Celebrating 10 years of Nexus' },
    { id: 'h3', name: 'Christmas', date: '2024-12-25', type: 'Public', description: 'Christmas Day' }
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const login = (email: string): boolean => {
    const user = allUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      notify(`Welcome back, ${user.name}`);
      return true;
    } else {
      notify("User not found (Try alice@nexus.com)");
      return false;
    }
  };

  const logout = () => setCurrentUser(null);

  const updateUser = (id: string, data: Partial<User>) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updatedUser = { ...u, ...data };
        // Sync department name if departmentId changed (legacy support)
        if (data.departmentId) {
          const dept = departments.find(d => d.id === data.departmentId);
          if (dept) updatedUser.department = dept.name;
        }

        // If updating current user, update session too
        if (currentUser && currentUser.id === id) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
    notify("User profile updated.");
  };

  const notify = (msg: string) => {
    setNotifications(prev => [{ id: Date.now().toString(), message: msg, type: 'info', read: false, createdAt: new Date().toISOString() }, ...prev]);
  };

  // Organization Logic
  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept = { ...dept, id: `d-${Date.now()}` };
    setDepartments([...departments, newDept]);
    notify(`Department "${dept.name}" created.`);
  };

  const updateDepartment = (id: string, data: Partial<Department>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    notify("Department updated.");
  };

  const deleteDepartment = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
    // Optional: Unlink users from this department
    notify('Department deleted.');
  };

  const addProject = (proj: Omit<Project, 'id'>) => {
    const newProj = { ...proj, id: `pj-${Date.now()}` };
    setProjects([...projects, newProj]);
    notify(`Project "${proj.name}" created.`);
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    notify("Project updated.");
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    notify('Project deleted.');
  };

  // Time Logs Logic
  const addTimeEntry = (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry = { ...entry, id: `te-${Date.now()}` };
    setTimeEntries(prev => [newEntry, ...prev]);
    notify(`Time logged for project.`);
  };

  const updateTimeEntry = (id: string, entry: Partial<TimeEntry>) => {
    setTimeEntries(prev => prev.map(t => t.id === id ? { ...t, ...entry } : t));
    notify("Time entry updated.");
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(t => t.id !== id));
    notify('Time entry deleted.');
  };

  // Leave Request Logic
  const addLeave = (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'userName' | 'userId'>) => {
    if (!currentUser) return;
    const newLeave: LeaveRequest = {
      ...req,
      id: `l-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      status: LeaveStatus.PENDING_MANAGER,
      createdAt: new Date().toISOString()
    };
    setLeaves([...leaves, newLeave]);
    
    // Notify logic
    const recipientNames = req.notifyUserIds 
      ? allUsers.filter(u => req.notifyUserIds?.includes(u.id)).map(u => u.name).join(', ')
      : 'Manager';
    
    const urgencyPrefix = req.isUrgent ? '[URGENT] ' : '';
    notify(`${urgencyPrefix}Leave request sent. Notified: ${recipientNames}`);
  };

  const editLeave = (id: string, req: Partial<LeaveRequest>) => {
    setLeaves(prev => prev.map(l => {
      if (l.id === id) {
        // Normally, editing might reset approval status. 
        // We'll notify the manager that an edit occurred.
        return { ...l, ...req }; 
      } 
      return l;
    }));
    notify("Leave request updated. Manager notified of changes.");
  };

  const addLeaves = (newLeaves: LeaveRequest[]) => {
    setLeaves(prev => [...prev, ...newLeaves]);
    notify(`Imported ${newLeaves.length} leave records via bulk upload.`);
  };

  const updateLeaveStatus = (id: string, status: LeaveStatus, comment?: string) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (status === LeaveStatus.PENDING_HR) {
        notify(`Leave approved by Manager. Forwarded to HR.`);
        return { ...l, status, managerComment: comment };
      }
      if (status === LeaveStatus.APPROVED) {
        notify(`Leave request finally approved for ${l.userName}. Email sent.`);
        return { ...l, status, hrComment: comment };
      }
      if (status === LeaveStatus.REJECTED) {
         notify(`Leave request rejected for ${l.userName}.`);
         return { ...l, status, managerComment: comment || l.managerComment, hrComment: comment || l.hrComment };
      }
      return l;
    }));
  };

  // Leave Type Management Logic
  const addLeaveType = (type: Omit<LeaveTypeConfig, 'id'>) => {
    const newType = { ...type, id: `lt-${Date.now()}` };
    setLeaveTypes([...leaveTypes, newType]);
    notify(`Leave Type "${type.name}" created.`);
  };

  const updateLeaveType = (id: string, updates: Partial<LeaveTypeConfig>) => {
    setLeaveTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    notify(`Leave Type updated.`);
  };

  const deleteLeaveType = (id: string) => {
    setLeaveTypes(prev => prev.filter(t => t.id !== id));
    notify(`Leave Type deleted.`);
  };

  // Other Logic
  const uploadPayslips = (newSlips: Payslip[]) => {
    setPayslips([...payslips, ...newSlips]);
    notify(`Uploaded ${newSlips.length} payslips.`);
  };

  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday = { ...holiday, id: `h-${Date.now()}` };
    setHolidays(prev => [...prev, newHoliday]);
    notify(`Holiday "${holiday.name}" added.`);
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    notify("Holiday updated.");
  };

  const addHolidays = (newHolidays: Holiday[]) => {
    setHolidays(prev => [...prev, ...newHolidays]);
    notify(`Added ${newHolidays.length} new holidays.`);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
    notify("Holiday removed.");
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      users: allUsers,
      currentUser, login, logout, updateUser,
      departments, addDepartment, updateDepartment, deleteDepartment,
      projects, addProject, updateProject, deleteProject,
      timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry,
      leaves, leaveTypes, addLeave, editLeave, addLeaves, updateLeaveStatus,
      addLeaveType, updateLeaveType, deleteLeaveType,
      payslips, uploadPayslips, 
      holidays, addHoliday, updateHoliday, addHolidays, deleteHoliday,
      notifications, markAllNotificationsRead,
      notify
    }}>
      {children}
    </AppContext.Provider>
  );
};

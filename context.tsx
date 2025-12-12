import React, { useState, useContext, createContext, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { api } from './services/api';
import { 
  User, UserRole, LeaveRequest, LeaveStatus, Payslip, Holiday, Notification, LeaveTypeConfig, Department, Project, TimeEntry, AttendanceRecord
} from './types';

interface AppContextType {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>; // Updated signature
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

  // Attendance
  attendanceRecords: AttendanceRecord[];
  checkIn: () => void;
  checkOut: (reason?: string) => void;
  updateAttendanceRecord: (id: string, data: Partial<AttendanceRecord>) => void;
  addManualAttendance: (data: Omit<AttendanceRecord, 'id'>) => void;
  getTodayAttendance: () => AttendanceRecord | undefined;

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
  const { instance, accounts } = useMsal();
  
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initial Data Load (Auth dependent)
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            // If MSAL authenticated
            const activeAccount = instance.getActiveAccount();
            if (activeAccount && activeAccount.username) {
                const user = await api.fetchUserByEmail(activeAccount.username);
                // Fallback for demo: If user not found in mock DB but logged in via MSAL, use Alice
                // In real app, you would create the user or show error
                if (user) {
                    setCurrentUser(user);
                    notify(`Welcome back, ${user.name}`);
                } else {
                    // Demo fallback if email doesn't match mock users
                    const demoUser = await api.fetchUserByEmail('alice@nexus.com');
                    if (demoUser) {
                        setCurrentUser({ ...demoUser, email: activeAccount.username, name: activeAccount.name || demoUser.name });
                    }
                }
            }
        } catch (e) {
            console.error("Auth Load Error", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    loadData();
  }, [instance, accounts]);

  // Load App Data when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
        const [u, d, p, t, l, lt, a, h, pay] = await Promise.all([
            api.fetchAllUsers(),
            api.fetchDepartments(),
            api.fetchProjects(),
            api.fetchTimeEntries(),
            api.fetchLeaves(),
            api.fetchLeaveTypes(),
            api.fetchAttendance(),
            api.fetchHolidays(),
            api.fetchPayslips()
        ]);
        
        setAllUsers(u);
        setDepartments(d);
        setProjects(p);
        setTimeEntries(t);
        setLeaves(l);
        setLeaveTypes(lt);
        setAttendanceRecords(a);
        setHolidays(h);
        setPayslips(pay);
    };

    fetchData();
  }, [currentUser]);

  // Auth Actions
  const login = async (email: string): Promise<boolean> => {
    // For legacy/demo login bypassing MSAL (Dev Mode)
    const user = await api.fetchUserByEmail(email);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    instance.logoutPopup();
    setCurrentUser(null);
  };

  const notify = (msg: string) => {
    setNotifications(prev => [{ id: Date.now().toString(), message: msg, type: 'info', read: false, createdAt: new Date().toISOString() }, ...prev]);
  };

  // --- Data Actions (Async Wrappers) ---

  const updateUser = async (id: string, data: Partial<User>) => {
    const updated = await api.updateUser(id, data);
    setAllUsers(prev => prev.map(u => u.id === id ? updated : u));
    if (currentUser?.id === id) setCurrentUser(updated);
    notify("User profile updated.");
  };

  const addDepartment = async (dept: Omit<Department, 'id'>) => {
    const newDept = await api.createDepartment(dept);
    setDepartments([...departments, newDept]);
    notify(`Department "${dept.name}" created.`);
  };

  const updateDepartment = (id: string, data: Partial<Department>) => {
    // Implementation for real API update would go here
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    notify("Department updated.");
  };

  const deleteDepartment = (id: string) => {
    setDepartments(departments.filter(d => d.id !== id));
    notify('Department deleted.');
  };

  const addProject = (proj: Omit<Project, 'id'>) => {
    // Mock impl for brevity in context, ideally move to api.createProject
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

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry = await api.createTimeEntry(entry);
    setTimeEntries(prev => [newEntry, ...prev]);
    notify(`Time logged.`);
  };

  const updateTimeEntry = (id: string, entry: Partial<TimeEntry>) => {
    setTimeEntries(prev => prev.map(t => t.id === id ? { ...t, ...entry } : t));
    notify("Time entry updated.");
  };

  const deleteTimeEntry = async (id: string) => {
    await api.deleteTimeEntry(id);
    setTimeEntries(prev => prev.filter(t => t.id !== id));
    notify('Time entry deleted.');
  };

  // Attendance
  const getTodayAttendance = () => {
    if (!currentUser) return undefined;
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.find(a => a.userId === currentUser.id && a.date === today);
  };

  const checkIn = async () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    if (getTodayAttendance()) return;
    
    const newRecord = await api.createAttendance({
      userId: currentUser.id,
      date: today,
      checkInTime: new Date().toISOString(),
    });
    setAttendanceRecords(prev => [...prev, newRecord]);
    notify("Checked in successfully.");
  };

  const checkOut = async (reason?: string) => {
    if (!currentUser) return;
    const record = getTodayAttendance();
    if (!record || record.checkOutTime) return;

    await api.updateAttendance(record.id, { checkOutTime: new Date().toISOString(), earlyLogoutReason: reason });
    setAttendanceRecords(prev => prev.map(a => 
      (a.id === record.id) ? { ...a, checkOutTime: new Date().toISOString(), earlyLogoutReason: reason } : a
    ));
    notify("Checked out successfully.");
  };

  const updateAttendanceRecord = async (id: string, data: Partial<AttendanceRecord>) => {
    await api.updateAttendance(id, data);
    setAttendanceRecords(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    notify("Attendance updated.");
  };

  const addManualAttendance = async (data: Omit<AttendanceRecord, 'id'>) => {
    const newRecord = await api.createAttendance(data);
    setAttendanceRecords(prev => [newRecord, ...prev]);
    notify("Attendance added manually.");
  };

  // Leaves
  const addLeave = async (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'userName' | 'userId'>) => {
    if (!currentUser) return;
    const payload = {
      ...req,
      userId: currentUser.id,
      userName: currentUser.name,
      status: LeaveStatus.PENDING_MANAGER,
      createdAt: new Date().toISOString()
    };
    const newLeave = await api.createLeave(payload);
    setLeaves([...leaves, newLeave]);
    notify("Leave request sent.");
  };

  const editLeave = async (id: string, req: Partial<LeaveRequest>) => {
    const updated = await api.updateLeave(id, req);
    setLeaves(prev => prev.map(l => l.id === id ? updated : l));
    notify("Leave request updated.");
  };

  const addLeaves = (newLeaves: LeaveRequest[]) => {
    setLeaves(prev => [...prev, ...newLeaves]);
    notify(`Imported ${newLeaves.length} leaves.`);
  };

  const updateLeaveStatus = async (id: string, status: LeaveStatus, comment?: string) => {
    const update = { status, ...(status === LeaveStatus.PENDING_HR || status === LeaveStatus.REJECTED ? { managerComment: comment } : { hrComment: comment }) };
    await api.updateLeave(id, update);
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...update } : l));
    notify(`Leave status updated to ${status}.`);
  };

  // Leave Types
  const addLeaveType = (type: Omit<LeaveTypeConfig, 'id'>) => {
    const newType = { ...type, id: `lt-${Date.now()}` };
    setLeaveTypes([...leaveTypes, newType]);
  };

  const updateLeaveType = (id: string, updates: Partial<LeaveTypeConfig>) => {
    setLeaveTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteLeaveType = (id: string) => {
    setLeaveTypes(prev => prev.filter(t => t.id !== id));
  };

  // Others
  const uploadPayslips = (newSlips: Payslip[]) => {
    setPayslips([...payslips, ...newSlips]);
    notify(`Uploaded ${newSlips.length} payslips.`);
  };

  const addHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHoliday = { ...holiday, id: `h-${Date.now()}` };
    setHolidays(prev => [...prev, newHoliday]);
    notify("Holiday added.");
  };

  const updateHoliday = (id: string, updates: Partial<Holiday>) => {
    setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const addHolidays = (newHolidays: Holiday[]) => {
    setHolidays(prev => [...prev, ...newHolidays]);
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      users: allUsers,
      currentUser, login, logout, updateUser, isLoading,
      departments, addDepartment, updateDepartment, deleteDepartment,
      projects, addProject, updateProject, deleteProject,
      timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry,
      leaves, leaveTypes, addLeave, editLeave, addLeaves, updateLeaveStatus,
      addLeaveType, updateLeaveType, deleteLeaveType,
      attendanceRecords, checkIn, checkOut, getTodayAttendance, updateAttendanceRecord, addManualAttendance,
      payslips, uploadPayslips, 
      holidays, addHoliday, updateHoliday, addHolidays, deleteHoliday,
      notifications, markAllNotificationsRead,
      notify
    }}>
      {children}
    </AppContext.Provider>
  );
};

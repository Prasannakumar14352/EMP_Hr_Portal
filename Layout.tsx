import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from './context';
import { 
  ShieldCheck, Calendar, DollarSign, LogOut, FileText, Bell, Users, User, Briefcase, Clock, PlayCircle, StopCircle, X, CheckCircle2, UserCheck, AlertTriangle
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }: { icon: any, label: string, path: string, active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
        active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { 
    currentUser, logout, notifications, markAllNotificationsRead, 
    checkIn, checkOut, getTodayAttendance, timeEntries, projects, addTimeEntry 
  } = useAppContext();
  
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Attendance State
  const attendance = getTodayAttendance();
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [showEarlyReasonModal, setShowEarlyReasonModal] = useState(false);
  const [earlyReason, setEarlyReason] = useState('');
  const [pendingAction, setPendingAction] = useState<'checkout' | 'early-checkout' | null>(null);
  
  // Simplified Time Log Form State
  const [logForm, setLogForm] = useState({
    projectId: '',
    task: '',
    hours: '8',
    minutes: '00',
    description: ''
  });

  // Derived state for tasks based on selected project
  const selectedProjectTasks = useMemo(() => {
    return projects.find(p => p.id === logForm.projectId)?.tasks || [];
  }, [logForm.projectId, projects]);

  const [isCustomTask, setIsCustomTask] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return <>{children}</>;

  // Attendance Calculations
  const checkInTime = attendance ? new Date(attendance.checkInTime) : null;
  const elapsedMs = checkInTime ? currentTime.getTime() - checkInTime.getTime() : 0;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const isEarlyLogout = elapsedHours < 9;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  // Unified Handler for Check Out (Early or Normal)
  const handleCheckOutClick = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasLog = timeEntries.some(t => t.userId === currentUser.id && t.date === todayStr);
    
    // Determine target action based on 9-hour rule
    const targetAction = isEarlyLogout ? 'early-checkout' : 'checkout';

    if (!hasLog) {
      // If no log exists, force the user to log time first
      setPendingAction(targetAction);
      setShowTimeLogModal(true);
    } else {
      // If log exists, proceed to logout flow
      if (isEarlyLogout) {
        setShowEarlyReasonModal(true);
      } else {
        checkOut();
      }
    }
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = (parseInt(logForm.hours) || 0) * 60 + (parseInt(logForm.minutes) || 0);
    
    addTimeEntry({
      userId: currentUser.id,
      projectId: logForm.projectId,
      task: logForm.task,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: duration,
      description: logForm.description,
      status: 'Pending',
      isBillable: true
    });
    
    setShowTimeLogModal(false);
    
    // Resume Pending Action after logging time
    if (pendingAction === 'early-checkout') {
      setShowEarlyReasonModal(true);
    } else if (pendingAction === 'checkout') {
      checkOut();
    }
    setPendingAction(null);
  };

  const handleEarlyReasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyReason.trim()) return;
    checkOut(earlyReason);
    setShowEarlyReasonModal(false);
    setEarlyReason('');
  };

  const userProjects = projects.filter(p => currentUser.projectIds?.includes(p.id));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col print:hidden">
        <div className="p-6 flex items-center space-x-2 border-b border-gray-100">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
             <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Nexus HR</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={ShieldCheck} label="Dashboard" path="/" active={location.pathname === '/'} />
          <SidebarItem icon={UserCheck} label="Attendance" path="/attendance" active={location.pathname === '/attendance'} />
          <SidebarItem icon={Clock} label="Time Logs" path="/time-logs" active={location.pathname === '/time-logs'} />
          <SidebarItem icon={Calendar} label="Leaves" path="/leaves" active={location.pathname === '/leaves'} />
          <SidebarItem icon={DollarSign} label="Payslips" path="/payslips" active={location.pathname === '/payslips'} />
          <SidebarItem icon={FileText} label="Holidays" path="/holidays" active={location.pathname === '/holidays'} />
          <SidebarItem icon={Briefcase} label="Organization" path="/organization" active={location.pathname === '/organization'} />
          <SidebarItem icon={Users} label="Directory" path="/directory" active={location.pathname === '/directory'} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div 
            className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            onClick={() => navigate('/profile')}
          >
            <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 print:hidden">
          <h1 className="text-lg font-semibold text-gray-800 capitalize hidden sm:block">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
          </h1>
          
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
             {/* Attendance Widget */}
             <div className="flex items-center bg-gray-50 rounded-full px-1 py-1 border border-gray-200">
                {!attendance ? (
                  <button 
                    onClick={checkIn}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-sm"
                  >
                    <PlayCircle size={14} /> Check In
                  </button>
                ) : attendance.checkOutTime ? (
                  <span className="flex items-center gap-2 px-4 py-1.5 text-gray-500 text-xs font-medium">
                    <CheckCircle2 size={14} /> Done for Today
                  </span>
                ) : (
                  <button 
                    onClick={handleCheckOutClick}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm animate-pulse ${
                      isEarlyLogout ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <StopCircle size={14} /> {isEarlyLogout ? 'Early Logout' : 'Check Out'}
                  </button>
                )}
                {attendance && !attendance.checkOutTime && (
                   <span className="text-[10px] text-emerald-700 font-mono px-3 border-l border-gray-200">
                      Since {new Date(attendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                   </span>
                )}
             </div>

             {/* Profile Link Mobile/Quick */}
             <button 
               onClick={() => navigate('/profile')}
               className="md:hidden p-2 text-gray-500 hover:text-emerald-600"
             >
                <User size={24} />
             </button>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className="p-2 text-gray-500 hover:text-emerald-600 relative"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto ring-1 ring-black ring-opacity-5">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="font-semibold text-gray-700">Notifications</h3>
                    <div className="flex space-x-3">
                      <button onClick={markAllNotificationsRead} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">Mark all read</button>
                      <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 last:border-0 transition-colors ${!n.read ? 'bg-emerald-50/50' : ''}`}>
                        <p className={`text-sm ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>

      {/* Early Logout Reason Modal */}
      {showEarlyReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3 text-amber-600">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold text-gray-800">Early Logout</h3>
                 </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                 You are logging out before completing 9 hours. Please provide a reason.
              </p>
              <form onSubmit={handleEarlyReasonSubmit} className="space-y-4">
                 <textarea 
                    required
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    rows={3}
                    placeholder="E.g., Medical appointment, Half-day leave..."
                    value={earlyReason}
                    onChange={(e) => setEarlyReason(e.target.value)}
                 />
                 <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowEarlyReasonModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">Confirm & Logout</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Missing Time Log Modal */}
      {showTimeLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                       <Clock size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-gray-800">Log Time Before Checkout</h3>
                       <p className="text-xs text-gray-500">You haven't logged any work for today yet.</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowTimeLogModal(false); setPendingAction(null); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>

              <form onSubmit={handleQuickLogSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                    <select 
                       required
                       className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                       value={logForm.projectId}
                       onChange={e => {
                         setLogForm({...logForm, projectId: e.target.value, task: ''});
                         setIsCustomTask(false);
                       }}
                    >
                       <option value="">Select Project...</option>
                       {userProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                       <option value="NO_PROJECT">General / Other</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task</label>
                    {selectedProjectTasks.length > 0 && !isCustomTask ? (
                      <div className="flex gap-2">
                        <select 
                          className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={logForm.task}
                          onChange={e => setLogForm({...logForm, task: e.target.value})}
                          required
                        >
                          <option value="">Select Task...</option>
                          {selectedProjectTasks.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsCustomTask(true)} className="px-3 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-500 whitespace-nowrap">Other</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          required
                          type="text" 
                          placeholder="What did you work on?"
                          className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={logForm.task}
                          onChange={e => setLogForm({...logForm, task: e.target.value})}
                        />
                         {selectedProjectTasks.length > 0 && (
                            <button type="button" onClick={() => setIsCustomTask(false)} className="px-3 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-500 whitespace-nowrap">List</button>
                         )}
                      </div>
                    )}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hours</label>
                       <input 
                          type="number" min="0" max="23"
                          className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={logForm.hours}
                          onChange={e => setLogForm({...logForm, hours: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minutes</label>
                       <select 
                          className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={logForm.minutes}
                          onChange={e => setLogForm({...logForm, minutes: e.target.value})}
                       >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                       </select>
                    </div>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                     <textarea 
                        required
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        rows={3}
                        value={logForm.description}
                        onChange={e => setLogForm({...logForm, description: e.target.value})}
                        placeholder="Enter details here..."
                     />
                 </div>
                 
                 <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2 mt-2">
                    <ShieldCheck size={18} /> Save & Proceed
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
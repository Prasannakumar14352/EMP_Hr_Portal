import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from './context';
import { 
  ShieldCheck, Calendar, DollarSign, LogOut, FileText, Bell, Users, User, Briefcase, Clock 
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
  const { currentUser, logout, notifications, markAllNotificationsRead } = useAppContext();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return <>{children}</>;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

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
        {/* Topbar for Mobile/Notifications */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 print:hidden">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
          </h1>
          
          <div className="flex items-center space-x-4">
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
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
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
    </div>
  );
};

export default Layout;
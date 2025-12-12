import React, { useMemo } from 'react';
import { useAppContext } from './context';
import { UserCheck, Clock, AlertTriangle } from 'lucide-react';

const Attendance = () => {
  const { currentUser, attendanceRecords } = useAppContext();

  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return attendanceRecords
      .filter(r => r.userId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords, currentUser]);

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return '-';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    
    if (diff < 0) return '-';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
        <p className="text-gray-500 text-sm">History of your check-in and check-out times.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
               <UserCheck size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Total Days Worked</p>
               <p className="text-xl font-bold text-gray-800">{myRecords.length}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Check Out</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {formatTime(record.checkInTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${record.checkOutTime ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        {formatTime(record.checkOutTime)}
                        {record.earlyLogoutReason && (
                           <div className="group relative ml-1">
                              <AlertTriangle size={14} className="text-amber-500 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                 Early Exit: {record.earlyLogoutReason}
                              </div>
                           </div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {calculateDuration(record.checkInTime, record.checkOutTime)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.checkOutTime 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-emerald-100 text-emerald-800 animate-pulse'
                    }`}>
                        {record.checkOutTime ? 'Completed' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {myRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <UserCheck size={32} className="mx-auto text-gray-300 mb-2"/>
                    <p>No attendance records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
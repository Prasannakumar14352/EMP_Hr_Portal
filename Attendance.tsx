import React, { useMemo, useState } from 'react';
import { useAppContext } from './context';
import { UserCheck, Clock, AlertTriangle, Edit2, PlusCircle, Calendar as CalendarIcon, X, Lock, Send } from 'lucide-react';
import { AttendanceRecord, UserRole } from './types';

const Attendance = () => {
  const { currentUser, attendanceRecords, updateAttendanceRecord, addManualAttendance, notify } = useAppContext();
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null); // ID if editing, null if new
  const [modalForm, setModalForm] = useState({
    date: '',
    checkInTime: '',
    checkOutTime: '',
  });
  const [requestReason, setRequestReason] = useState('');

  const isHR = currentUser?.role === UserRole.HR;

  // Date constraints helpers
  const todayStr = new Date().toISOString().split('T')[0];

  // --- Helpers ---
  
  // Logic: Direct edit allowed if user is HR OR (record date is today OR yesterday)
  const isDirectEditAllowed = (recordDateStr: string) => {
    if (isHR) return true;
    if (!recordDateStr) return true; // Fallback
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recordDate = new Date(recordDateStr);
    recordDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - recordDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // 0 = Today, 1 = Yesterday. Allow slightly more for potential timezone overlaps, effectively < 2 days.
    return diffDays >= -0.1 && diffDays < 2; 
  };

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

  // Convert ISO string to HH:mm for input
  const getHHMM = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Handlers
  const handleEditClick = (record: AttendanceRecord) => {
    setIsEditing(record.id);
    setModalForm({
      date: record.date,
      checkInTime: getHHMM(record.checkInTime),
      checkOutTime: getHHMM(record.checkOutTime)
    });
    setRequestReason('');
    setShowModal(true);
  };

  const handleAddClick = () => {
    setIsEditing(null);
    // Default to yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    setModalForm({
      date: yesterdayStr,
      checkInTime: '09:00',
      checkOutTime: '18:00'
    });
    setRequestReason('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const isDirect = isDirectEditAllowed(modalForm.date);

    if (!isDirect) {
        // Request Mode Logic
        if (!requestReason.trim()) {
            alert("Please provide a reason for this correction request.");
            return;
        }
        // Simulate sending request
        notify(`Correction request for ${modalForm.date} sent to HR. Status: Pending Approval.`);
        setShowModal(false);
        return;
    }

    // Direct Update/Add Logic
    const baseDate = new Date(modalForm.date);
    
    const [inH, inM] = modalForm.checkInTime.split(':').map(Number);
    const checkInDate = new Date(baseDate);
    checkInDate.setHours(inH, inM, 0, 0);

    let checkOutDateStr = undefined;
    if (modalForm.checkOutTime) {
      const [outH, outM] = modalForm.checkOutTime.split(':').map(Number);
      const checkOutDate = new Date(baseDate);
      checkOutDate.setHours(outH, outM, 0, 0);
      checkOutDateStr = checkOutDate.toISOString();
    }

    if (isEditing) {
      updateAttendanceRecord(isEditing, {
        checkInTime: checkInDate.toISOString(),
        checkOutTime: checkOutDateStr,
        earlyLogoutReason: undefined // Clear flags if manually corrected
      });
    } else {
      addManualAttendance({
        userId: currentUser.id,
        date: modalForm.date,
        checkInTime: checkInDate.toISOString(),
        checkOutTime: checkOutDateStr,
      });
    }

    setShowModal(false);
  };

  const isRequestMode = !isDirectEditAllowed(modalForm.date);

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
          <p className="text-gray-500 text-sm">History of your check-in and check-out times.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm font-medium"
        >
          <PlusCircle size={18} />
          <span>Log Missing Day</span>
        </button>
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
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myRecords.map((record) => {
                const canDirectEdit = isDirectEditAllowed(record.date);
                return (
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
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleEditClick(record)}
                         className={`p-2 rounded-lg transition ${
                             canDirectEdit 
                             ? 'text-emerald-600 hover:bg-emerald-50' 
                             : 'text-amber-600 hover:bg-amber-50'
                         }`}
                         title={canDirectEdit ? "Edit Record" : "Request Correction (Requires Approval)"}
                       >
                          {canDirectEdit ? <Edit2 size={16} /> : <Lock size={16} />}
                       </button>
                    </td>
                  </tr>
                );
              })}
              {myRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <UserCheck size={32} className="mx-auto text-gray-300 mb-2"/>
                    <p>No attendance records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                {isRequestMode ? (
                    <><Lock size={20} className="text-amber-500" /> Request Correction</>
                ) : (
                    <>{isEditing ? 'Correct Attendance' : 'Log Missing Day'}</>
                )}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {isRequestMode 
                 ? 'This record is locked. Submit a request to HR for approval.' 
                 : 'You can update records for Today or Yesterday directly.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <div className="relative">
                   <CalendarIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
                   <input 
                    type="date" 
                    required 
                    className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ${isRequestMode ? 'border-amber-300 focus:ring-amber-500' : 'focus:ring-emerald-500'}`}
                    value={modalForm.date}
                    onChange={(e) => setModalForm({...modalForm, date: e.target.value})}
                    disabled={!!isEditing} // Cannot change date when editing existing record
                    max={todayStr}
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Check In Time</label>
                   <input 
                    type="time" 
                    required 
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={modalForm.checkInTime}
                    onChange={(e) => setModalForm({...modalForm, checkInTime: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Check Out Time</label>
                   <input 
                    type="time" 
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={modalForm.checkOutTime}
                    onChange={(e) => setModalForm({...modalForm, checkOutTime: e.target.value})}
                   />
                </div>
              </div>

              {isRequestMode && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 animate-in fade-in">
                      <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Reason for Change</label>
                      <textarea 
                        required
                        rows={2}
                        className="w-full border border-amber-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        placeholder="Why do you need to change this past record?"
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                      />
                  </div>
              )}

              <div className="pt-2">
                 <button 
                    type="submit" 
                    className={`w-full py-2 rounded-lg font-bold shadow-sm transition flex items-center justify-center gap-2 ${
                        isRequestMode 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                 >
                    {isRequestMode ? <><Send size={16}/> Submit Request to HR</> : (isEditing ? 'Update Record' : 'Log Attendance')}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
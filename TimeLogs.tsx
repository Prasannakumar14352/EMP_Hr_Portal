import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from './context';
import { TimeEntry, Project, UserRole } from './types';
import { 
  Clock, Plus, Filter, FileText, ChevronDown, Calendar as CalendarIcon, Edit2, Trash2,
  DollarSign, FileSpreadsheet, File as FileIcon, AlertTriangle, CheckCircle2, Briefcase, Search
} from 'lucide-react';

const TimeLogs = () => {
  const { currentUser, projects, timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, users, notify } = useAppContext();
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUser, setFilterUser] = useState('All'); // Dropdown for specific selection
  const [searchEmployee, setSearchEmployee] = useState(''); // Text search
  const [dateRange, setDateRange] = useState<'Week' | 'Month'>('Month');
  const [viewDate, setViewDate] = useState(new Date());

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: '',
    task: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    isBillable: true
  });

  // Time Entry Method State
  const [entryMethod, setEntryMethod] = useState<'duration' | 'range'>('duration');
  
  // Duration Mode State
  const [durationInput, setDurationInput] = useState({ hours: '8', minutes: '00' });
  
  // Range Mode State
  const [rangeInput, setRangeInput] = useState({
    startHour: '09', startMinute: '00', startPeriod: 'AM',
    endHour: '05', endMinute: '00', endPeriod: 'PM'
  });
  
  // Toggle between project tasks and custom input
  const [isCustomTask, setIsCustomTask] = useState(false);

  const isHR = currentUser?.role === UserRole.HR;
  
  const NO_PROJECT_ID = "NO_PROJECT";

  // Derived state for tasks based on selected project
  const selectedProjectTasks = useMemo(() => {
    return projects.find(p => p.id === formData.projectId)?.tasks || [];
  }, [formData.projectId, projects]);

  const hasPredefinedTasks = selectedProjectTasks.length > 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Helpers ---
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };
  
  const getProjectName = (id?: string) => {
      if (!id || id === NO_PROJECT_ID) return 'General Task';
      return projects.find(p => p.id === id)?.name || 'Unknown Project';
  };

  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    // Adjust to Monday
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        week.push(d);
    }
    return week;
  };

  const weekDays = getWeekDays(viewDate);
  const currentMonthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // --- Filtering ---
  const availableProjects = isHR ? projects : projects.filter(p => currentUser?.projectIds?.includes(p.id));
  
  const visibleEntries = useMemo(() => {
    let entries = timeEntries;
    
    // Filter by User 
    if (isHR) {
       if (filterUser !== 'All') {
          entries = entries.filter(e => e.userId === filterUser);
       }
       if (searchEmployee) {
          const lowerQ = searchEmployee.toLowerCase();
          entries = entries.filter(e => {
             const u = users.find(usr => usr.id === e.userId);
             return u?.name.toLowerCase().includes(lowerQ);
          });
       }
    } else {
       entries = entries.filter(e => e.userId === currentUser?.id);
    }

    if (filterProject !== 'All') {
        entries = entries.filter(e => e.projectId === filterProject);
    }

    if (filterStatus !== 'All') {
        entries = entries.filter(e => e.status === filterStatus);
    }

    if (dateRange === 'Month') {
        const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
        entries = entries.filter(e => {
            const d = new Date(e.date);
            return d >= startOfMonth && d <= endOfMonth;
        });
    } else {
        const startOfWeek = weekDays[0];
        const endOfWeek = new Date(weekDays[0]);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59);

        entries = entries.filter(e => {
            const d = new Date(e.date);
            return d >= startOfWeek && d <= endOfWeek;
        });
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timeEntries, currentUser, filterProject, filterStatus, filterUser, searchEmployee, viewDate, isHR, dateRange, weekDays, users]);

  // Project Summaries
  const projectSummaries = useMemo(() => {
     const summary: Record<string, number> = {};
     visibleEntries.forEach(e => {
        const pid = e.projectId || NO_PROJECT_ID;
        summary[pid] = (summary[pid] || 0) + e.durationMinutes;
     });
     return summary;
  }, [visibleEntries]);

  // Weekly Report Matrix Data
  const weeklyReportData = useMemo(() => {
     const startOfWeek = weekDays[0];
     const endOfWeek = weekDays[4]; // Friday
     const endOfWeekQuery = new Date(endOfWeek);
     endOfWeekQuery.setHours(23, 59, 59);

     let relevantEntries = timeEntries.filter(e => {
        const d = new Date(e.date);
        return d >= startOfWeek && d <= endOfWeekQuery;
     });

     if (isHR) {
        if (filterUser !== 'All') relevantEntries = relevantEntries.filter(e => e.userId === filterUser);
        if (searchEmployee) {
           const lowerQ = searchEmployee.toLowerCase();
           relevantEntries = relevantEntries.filter(e => {
              const u = users.find(usr => usr.id === e.userId);
              return u?.name.toLowerCase().includes(lowerQ);
           });
        }
     } else {
        relevantEntries = relevantEntries.filter(e => e.userId === currentUser?.id);
     }

     const report: { projectId: string, days: number[], total: number }[] = [];
     const relevantProjectIds = Array.from(new Set(relevantEntries.map(e => e.projectId || NO_PROJECT_ID)));
     
     relevantProjectIds.forEach(projId => {
        const projEntries = relevantEntries.filter(e => (e.projectId || NO_PROJECT_ID) === projId);
        const dayTotals = [0, 0, 0, 0, 0]; // Mon-Fri
        let rowTotal = 0;

        projEntries.forEach(e => {
            const d = new Date(e.date);
            const dayIdx = d.getDay() - 1; 
            if (dayIdx >= 0 && dayIdx < 5) {
                dayTotals[dayIdx] += e.durationMinutes;
                rowTotal += e.durationMinutes;
            }
        });

        report.push({ projectId: projId, days: dayTotals, total: rowTotal });
     });

     return report;
  }, [timeEntries, weekDays, currentUser, isHR, filterUser, searchEmployee, users]);


  // --- Bulk Selection ---
  const toggleSelectAll = () => {
    if (selectedIds.size === visibleEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleEntries.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const confirmBulkDelete = () => {
    selectedIds.forEach(id => deleteTimeEntry(id));
    notify(`Deleted ${selectedIds.size} entries.`);
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
  };

  // --- Validation Helpers ---
  const validateHours = (val: string, min: number, max: number) => {
      let num = parseInt(val);
      if (isNaN(num)) return min.toString();
      if (num < min) return min.toString();
      if (num > max) return max.toString();
      return num.toString();
  };

  const validateMinutes = (val: string) => {
      let num = parseInt(val);
      if (isNaN(num)) return '00';
      // Snap to nearest 15
      const snapped = Math.round(num / 15) * 15;
      const final = snapped === 60 ? 0 : snapped;
      return final.toString().padStart(2, '0');
  };

  const calculateMinutesFromRange = () => {
      let startH = parseInt(rangeInput.startHour);
      let endH = parseInt(rangeInput.endHour);
      const startM = parseInt(rangeInput.startMinute);
      const endM = parseInt(rangeInput.endMinute);

      // Convert to 24h
      if (rangeInput.startPeriod === 'PM' && startH !== 12) startH += 12;
      if (rangeInput.startPeriod === 'AM' && startH === 12) startH = 0;
      
      if (rangeInput.endPeriod === 'PM' && endH !== 12) endH += 12;
      if (rangeInput.endPeriod === 'AM' && endH === 12) endH = 0;

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (endTotal <= startTotal) {
          return -1; 
      }

      return endTotal - startTotal;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let durationMinutes = 0;
    
    if (entryMethod === 'duration') {
        const h = parseInt(durationInput.hours) || 0;
        const m = parseInt(durationInput.minutes) || 0;
        durationMinutes = h * 60 + m;
    } else {
        durationMinutes = calculateMinutesFromRange();
        if (durationMinutes === -1) {
            alert("End time must be after start time.");
            return;
        }
    }
    
    if (durationMinutes <= 0) {
       alert("Please enter a valid time duration greater than 0 minutes.");
       return;
    }
    
    const entryData = {
        userId: currentUser.id, 
        projectId: formData.projectId === NO_PROJECT_ID ? '' : formData.projectId,
        task: formData.task,
        date: formData.date,
        durationMinutes: durationMinutes,
        description: formData.description,
        status: 'Pending' as const,
        isBillable: formData.isBillable
    };

    if (editingId) {
        updateTimeEntry(editingId, entryData);
    } else {
        addTimeEntry(entryData);
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (entry: TimeEntry) => {
      setEditingId(entry.id);
      
      const h = Math.floor(entry.durationMinutes / 60);
      const m = entry.durationMinutes % 60;
      
      setEntryMethod('duration');
      setDurationInput({ hours: h.toString(), minutes: m.toString().padStart(2, '0') });

      setFormData({
          projectId: entry.projectId || NO_PROJECT_ID,
          task: entry.task,
          date: entry.date,
          description: entry.description,
          isBillable: entry.isBillable
      });
      // Detect if the existing task is not in the project list to set isCustomTask correctly
      const projTasks = projects.find(p => p.id === (entry.projectId || NO_PROJECT_ID))?.tasks || [];
      if (projTasks.length > 0 && !projTasks.includes(entry.task)) {
         setIsCustomTask(true);
      } else {
         setIsCustomTask(false);
      }
      
      setShowModal(true);
      setActiveMenuId(null);
  };

  const handleApprove = (entry: TimeEntry) => {
      updateTimeEntry(entry.id, { status: 'Approved' });
      setActiveMenuId(null);
  };

  const initiateDelete = (id: string) => {
      setItemToDelete(id);
      setShowDeleteConfirm(true);
      setActiveMenuId(null);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
         deleteTimeEntry(itemToDelete);
         notify("Time entry deleted.");
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
  };

  const resetForm = () => {
      setEditingId(null);
      setFormData({ 
        projectId: '', 
        task: '', 
        date: new Date().toISOString().split('T')[0], 
        description: '', 
        isBillable: true 
      });
      setIsCustomTask(false);
      setEntryMethod('duration');
      setDurationInput({ hours: '8', minutes: '00' });
      setRangeInput({
        startHour: '09', startMinute: '00', startPeriod: 'AM',
        endHour: '05', endMinute: '00', endPeriod: 'PM'
      });
  };

  const openAddModal = () => {
      resetForm();
      setShowModal(true);
  };

  const handleExport = (type: 'csv' | 'pdf' | 'excel') => {
      const headers = ['Date', 'Project', 'Task', 'User', 'Duration (min)', 'Status', 'Billable'];
      const rows = visibleEntries.map(e => [
          e.date,
          getProjectName(e.projectId),
          e.task.replace(/,/g, ' '),
          users.find(u => u.id === e.userId)?.name || 'Unknown',
          e.durationMinutes,
          e.status,
          e.isBillable ? 'Yes' : 'No'
      ]);

      if (type === 'pdf') {
          window.print();
          return;
      }

      if (type === 'excel') {
          const tableContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
              <meta charset="UTF-8">
            </head>
            <body>
              <table border="1">
                <thead>
                  <tr>${headers.map(h => `<th style="background-color:#f0fdf4; font-weight:bold;">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
            </body>
            </html>
          `;
          const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `timesheet_export_${new Date().toISOString().split('T')[0]}.xls`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          notify("Excel file downloaded.");
          return;
      }

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `timesheet_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify("CSV file downloaded.");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 print:hidden">
           <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center space-x-3 text-red-600 mb-4">
                 <AlertTriangle size={24} />
                 <h3 className="text-lg font-bold text-gray-800">Delete Entry?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                 Are you sure you want to delete this time entry? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                 <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                 <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium shadow-sm">Delete</button>
              </div>
           </div>
        </div>
       )}

       {/* Bulk Delete Confirmation Modal */}
       {showBulkDeleteConfirm && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 print:hidden">
           <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center space-x-3 text-red-600 mb-4">
                 <AlertTriangle size={24} />
                 <h3 className="text-lg font-bold text-gray-800">Bulk Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                 Are you sure you want to delete <strong>{selectedIds.size}</strong> selected entries?
              </p>
              <div className="flex justify-end space-x-3">
                 <button onClick={() => setShowBulkDeleteConfirm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                 <button onClick={confirmBulkDelete} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium shadow-sm">Delete All</button>
              </div>
           </div>
        </div>
       )}

       {/* Header */}
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Clock size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-800">Time Logs</h2>
                <p className="text-sm text-gray-500">View and manage your time entries</p>
             </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 print:hidden">
              <button 
                onClick={() => setDateRange('Week')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${dateRange === 'Week' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <CalendarIcon size={14} />
                Week View
              </button>
              <button 
                onClick={() => setDateRange('Month')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${dateRange === 'Month' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <CalendarIcon size={14} />
                Month View
              </button>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto print:hidden">
            {isHR && (
                <div className="relative">
                   <input 
                      type="text" 
                      placeholder="Search Employee..." 
                      className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-48 shadow-sm"
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                   />
                   <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                </div>
             )}

             {isHR && selectedIds.size > 0 && (
                <button 
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in"
                >
                   <Trash2 size={16} /> Delete Selected ({selectedIds.size})
                </button>
             )}
             
             <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <button onClick={() => handleExport('csv')} className="px-3 py-2 text-gray-600 hover:bg-gray-50 border-r border-gray-200 text-sm flex items-center gap-2" title="Export CSV">
                   <FileText size={16} /> <span className="hidden sm:inline">CSV</span>
                </button>
                <button onClick={() => handleExport('excel')} className="px-3 py-2 text-gray-600 hover:bg-gray-50 border-r border-gray-200 text-sm flex items-center gap-2" title="Export Excel">
                   <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
                </button>
                <button onClick={() => handleExport('pdf')} className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-sm flex items-center gap-2" title="Print/PDF">
                   <FileIcon size={16} /> <span className="hidden sm:inline">Print</span>
                </button>
             </div>

             <button 
               onClick={openAddModal}
               className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium shadow-sm"
             >
               <Plus size={18} />
               <span>Log Time</span>
             </button>
          </div>
       </div>

       {/* Filters */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
             <div className="flex items-center gap-2 text-gray-600">
                <Filter size={18} />
                <span className="text-sm font-medium">Filters:</span>
             </div>
             
             <div className="relative group">
                <select 
                   value={filterProject} 
                   onChange={(e) => setFilterProject(e.target.value)}
                   className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-white transition"
                >
                   <option value="All">All Projects</option>
                   {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
             </div>

             <div className="relative group">
                <select 
                   value={filterStatus} 
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-white transition"
                >
                   <option value="All">All Status</option>
                   <option value="Pending">Pending</option>
                   <option value="Approved">Approved</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
             </div>

             <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
                <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-white hover:shadow-sm rounded transition text-gray-500"><ChevronDown size={16} className="rotate-90"/></button>
                <span className="px-3 text-sm font-medium text-gray-700 min-w-[140px] text-center">{currentMonthName}</span>
                <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-white hover:shadow-sm rounded transition text-gray-500"><ChevronDown size={16} className="-rotate-90"/></button>
             </div>
          </div>
          
          <div className="text-sm text-gray-500">
             Showing {visibleEntries.length} entries
          </div>
       </div>

       {Object.keys(projectSummaries).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-fade-in print:hidden">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                 <Briefcase size={16} className="text-emerald-600"/> Project Summary
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                  {Object.entries(projectSummaries).map(([projId, totalMinutes]) => (
                      <div key={projId} className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-w-[150px] flex-shrink-0">
                          <p className="text-xs text-gray-500 uppercase font-medium truncate mb-1">{getProjectName(projId)}</p>
                          <p className="text-lg font-bold text-gray-800">{formatDuration(totalMinutes)}</p>
                      </div>
                  ))}
              </div>
          </div>
       )}

       {dateRange === 'Week' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in print:mb-6">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between">
                <h3 className="font-bold text-gray-700">Weekly Summary</h3>
                <span className="text-xs text-gray-500">{weekDays[0].toLocaleDateString()} - {weekDays[4].toLocaleDateString()}</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead>
                      <tr className="bg-white border-b border-gray-100 text-gray-500">
                         <th className="px-4 py-3 font-medium">Project</th>
                         {weekDays.map(d => (
                            <th key={d.toISOString()} className="px-4 py-3 font-medium text-center">
                               {d.toLocaleDateString('en-US', { weekday: 'short' })}<br/>
                               <span className="text-xs font-normal">{d.getDate()}</span>
                            </th>
                         ))}
                         <th className="px-4 py-3 font-bold text-right">Total</th>
                      </tr>
                   </thead>
                   <tbody>
                      {weeklyReportData.length > 0 ? weeklyReportData.map(row => (
                         <tr key={row.projectId} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{getProjectName(row.projectId)}</td>
                            {row.days.map((min, idx) => (
                               <td key={idx} className="px-4 py-3 text-center text-gray-600">
                                  {min > 0 ? formatDuration(min) : '-'}
                               </td>
                            ))}
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatDuration(row.total)}</td>
                         </tr>
                      )) : (
                         <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No time logged this week.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       )}

       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                   <tr>
                      <th className="px-4 py-4 w-10">
                        <div className="flex items-center justify-center">
                           <input 
                             type="checkbox" 
                             checked={selectedIds.size === visibleEntries.length && visibleEntries.length > 0} 
                             onChange={toggleSelectAll}
                             className="rounded text-emerald-600 focus:ring-emerald-500"
                           />
                        </div>
                      </th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-200">Date</th>
                      {isHR && <th className="px-6 py-4 font-semibold border-b border-gray-200">User</th>}
                      <th className="px-6 py-4 font-semibold border-b border-gray-200">Project / Task</th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-200">Duration</th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-200">Status</th>
                      <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {visibleEntries.map(entry => (
                      <tr key={entry.id} className="hover:bg-emerald-50/30 transition-colors group">
                         <td className="px-4 py-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(entry.id)}
                              onChange={() => toggleSelect(entry.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <CalendarIcon size={14} className="text-gray-400"/>
                               <span className="text-sm text-gray-700">{entry.date}</span>
                            </div>
                         </td>
                         {isHR && (
                           <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-700">{users.find(u => u.id === entry.userId)?.name}</span>
                           </td>
                         )}
                         <td className="px-6 py-4">
                            <div>
                               <p className="text-sm font-bold text-gray-800">{getProjectName(entry.projectId)}</p>
                               <p className="text-xs text-gray-500">{entry.task}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                               {formatDuration(entry.durationMinutes)}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                               {entry.status}
                            </div>
                            {entry.isBillable && <span className="ml-2 text-xs text-emerald-600 font-bold border border-emerald-200 px-1 rounded">$</span>}
                         </td>
                         <td className="px-6 py-4 text-right relative">
                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               {isHR && entry.status === 'Pending' && (
                                  <button onClick={() => handleApprove(entry)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Approve">
                                     <CheckCircle2 size={16} />
                                  </button>
                               )}
                               
                               <button onClick={() => handleEdit(entry)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                                  <Edit2 size={16} />
                               </button>
                               <button onClick={() => initiateDelete(entry.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Delete">
                                  <Trash2 size={16} />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {visibleEntries.length === 0 && (
                      <tr>
                         <td colSpan={isHR ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                            <Clock size={32} className="mx-auto text-gray-300 mb-2"/>
                            <p>No time entries found.</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {showModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Time Entry' : 'Log Time'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><ChevronDown className="rotate-180" size={20}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input 
                           type="date" 
                           required 
                           className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                           value={formData.date}
                           onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                        <select 
                           className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                           value={formData.projectId}
                           onChange={e => {
                              setFormData({...formData, projectId: e.target.value, task: ''});
                              setIsCustomTask(false);
                           }}
                        >
                           <option value={NO_PROJECT_ID}>General (No Project)</option>
                           {availableProjects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task</label>
                     {selectedProjectTasks.length > 0 && !isCustomTask ? (
                        <div className="flex gap-2">
                           <select 
                              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              value={formData.task}
                              onChange={e => setFormData({...formData, task: e.target.value})}
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
                              type="text" 
                              required 
                              placeholder="What are you working on?"
                              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                              value={formData.task}
                              onChange={e => setFormData({...formData, task: e.target.value})}
                              autoFocus={isCustomTask}
                           />
                           {selectedProjectTasks.length > 0 && (
                              <button type="button" onClick={() => setIsCustomTask(false)} className="px-3 border rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-500 whitespace-nowrap">List</button>
                           )}
                        </div>
                     )}
                  </div>

                  <div className="bg-gray-50 p-1 rounded-lg flex text-sm mb-2 border border-gray-200">
                     <button type="button" onClick={() => setEntryMethod('duration')} className={`flex-1 py-1.5 rounded-md transition ${entryMethod === 'duration' ? 'bg-white shadow text-emerald-600 font-medium' : 'text-gray-500'}`}>Duration</button>
                     <button type="button" onClick={() => setEntryMethod('range')} className={`flex-1 py-1.5 rounded-md transition ${entryMethod === 'range' ? 'bg-white shadow text-emerald-600 font-medium' : 'text-gray-500'}`}>Start / End Time</button>
                  </div>

                  {entryMethod === 'duration' ? (
                     <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hours</label>
                           <input 
                              type="number"
                              min="0"
                              max="23"
                              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={durationInput.hours}
                              onChange={e => setDurationInput({...durationInput, hours: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minutes</label>
                           <select 
                              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={durationInput.minutes}
                              onChange={e => setDurationInput({...durationInput, minutes: e.target.value})}
                           >
                              <option value="00">00</option>
                              <option value="15">15</option>
                              <option value="30">30</option>
                              <option value="45">45</option>
                           </select>
                        </div>
                     </div>
                  ) : (
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-gray-500 w-10">Start:</span>
                           <input 
                              type="number" 
                              min="1" 
                              max="12"
                              className="bg-white border rounded p-1 text-sm w-16 text-center" 
                              value={rangeInput.startHour} 
                              onChange={e => setRangeInput({...rangeInput, startHour: e.target.value})}
                              onBlur={e => setRangeInput({...rangeInput, startHour: validateHours(e.target.value, 1, 12)})}
                           />
                           <span className="text-gray-400">:</span>
                           <input 
                              type="number" 
                              min="0" 
                              max="59" 
                              step="15"
                              className="bg-white border rounded p-1 text-sm w-16 text-center" 
                              value={rangeInput.startMinute} 
                              onChange={e => setRangeInput({...rangeInput, startMinute: e.target.value})}
                              onBlur={e => setRangeInput({...rangeInput, startMinute: validateMinutes(e.target.value)})}
                           />
                           <select className="bg-white border rounded p-1 text-sm ml-2" value={rangeInput.startPeriod} onChange={e => setRangeInput({...rangeInput, startPeriod: e.target.value})}><option>AM</option><option>PM</option></select>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-gray-500 w-10">End:</span>
                           <input 
                              type="number" 
                              min="1" 
                              max="12"
                              className="bg-white border rounded p-1 text-sm w-16 text-center" 
                              value={rangeInput.endHour} 
                              onChange={e => setRangeInput({...rangeInput, endHour: e.target.value})}
                              onBlur={e => setRangeInput({...rangeInput, endHour: validateHours(e.target.value, 1, 12)})}
                           />
                           <span className="text-gray-400">:</span>
                           <input 
                              type="number" 
                              min="0" 
                              max="59" 
                              step="15"
                              className="bg-white border rounded p-1 text-sm w-16 text-center" 
                              value={rangeInput.endMinute} 
                              onChange={e => setRangeInput({...rangeInput, endMinute: e.target.value})}
                              onBlur={e => setRangeInput({...rangeInput, endMinute: validateMinutes(e.target.value)})}
                           />
                           <select className="bg-white border rounded p-1 text-sm ml-2" value={rangeInput.endPeriod} onChange={e => setRangeInput({...rangeInput, endPeriod: e.target.value})}><option>AM</option><option>PM</option></select>
                        </div>
                     </div>
                  )}

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                     <textarea 
                        className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Details about the work done..."
                     />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                     <input 
                       type="checkbox" 
                       id="billable" 
                       checked={formData.isBillable} 
                       onChange={e => setFormData({...formData, isBillable: e.target.checked})}
                       className="rounded text-emerald-600 focus:ring-emerald-500"
                     />
                     <label htmlFor="billable" className="text-sm text-gray-700 flex items-center gap-1 font-medium">
                        Billable <DollarSign size={14} className="text-gray-400"/>
                     </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                     <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                     <button type="submit" className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium shadow-sm">Save Entry</button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default TimeLogs;
import React, { useState } from 'react';
import { useAppContext } from './context';
import { UserRole, Holiday } from './types';
import { 
  Upload, Calendar as CalendarIcon, List, Info, 
  CheckCircle, AlertCircle, Plus, Trash2, X, Clock, Edit2, FileDown, FileSpreadsheet
} from 'lucide-react';

// Declare XLSX globally from the script tag in index.html
declare const XLSX: any;

const Holidays = () => {
  const { holidays, currentUser, addHolidays, addHoliday, updateHoliday, deleteHoliday } = useAppContext();
  
  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    date: string;
    type: 'Public' | 'Company';
    description: string;
  }>({ name: '', date: '', type: 'Public', description: '' });

  // --- File Upload & Validation ---
  
  const processData = (data: any[]) => {
      const newHolidays: Holiday[] = [];
      const errors: string[] = [];

      // If data has headers, skip the first row if it matches known headers
      let startIdx = 0;
      if (data.length > 0 && (data[0][0] === 'Name' || data[0][0] === 'name')) {
          startIdx = 1;
      }

      for (let i = startIdx; i < data.length; i++) {
        const row = data[i];
        // Handle array (CSV/Excel row)
        // Expected order: Name, Date, Type, Notes
        
        if (!row || row.length === 0) continue;

        const name = row[0]?.toString().trim();
        let dateStr = row[1];
        const typeRaw = row[2]?.toString().trim() || 'Public';
        const description = row[3]?.toString().trim() || '';

        if (!name) {
          errors.push(`Row ${i + 1}: Missing holiday name.`);
          continue;
        }

        // Handle Excel Date serial numbers if applicable
        if (typeof dateStr === 'number') {
            const dateObj = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            dateStr = dateObj.toISOString().split('T')[0];
        } else {
            dateStr = dateStr?.toString().trim();
        }
        
        const dateObj = new Date(dateStr);
        if (!dateStr || isNaN(dateObj.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}". Use YYYY-MM-DD.`);
          continue;
        }

        const type = (typeRaw.toLowerCase() === 'company') ? 'Company' : 'Public';

        newHolidays.push({
          id: `h-imp-${Date.now()}-${i}`,
          name,
          date: dateStr,
          type: type as 'Public' | 'Company',
          description
        });
      }

      if (errors.length > 0) {
        setFeedback({ type: 'error', message: `Import failed with ${errors.length} errors: ${errors.slice(0, 3).join('; ')}...` });
      } else if (newHolidays.length === 0) {
        setFeedback({ type: 'error', message: 'No valid holiday data found.' });
      } else {
        addHolidays(newHolidays);
        setFeedback({ type: 'success', message: `Successfully imported ${newHolidays.length} holidays.` });
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Get data as array of arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    } else {
        // CSV Parsing
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(','));
            processData(lines);
        };
        reader.readAsText(file);
    }
    
    // Reset input
    e.target.value = '';
  };

  const downloadTemplate = () => {
      // Create a dummy workbook
      const wb = XLSX.utils.book_new();
      const headers = ['Name', 'Date', 'Type', 'Notes'];
      const exampleData = [
          ['Founders Day', '2024-06-15', 'Company', 'Annual celebration event'],
          ['Good Friday', '2024-03-29', 'Public', 'Bank holiday'],
          ['Diwali', '2024-11-01', 'Public', 'Festival of Lights'],
          ['Team Outing', '2024-09-20', 'Company', 'Offsite team building']
      ];
      
      const wsData = [headers, ...exampleData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Add column widths for better UX
      ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];

      XLSX.utils.book_append_sheet(wb, ws, "Holidays Template");
      XLSX.writeFile(wb, "Nexus_Holiday_Template.xlsx");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateHoliday(editingId, formData);
    } else {
      addHoliday(formData);
    }
    setShowAddModal(false);
    setFormData({ name: '', date: '', type: 'Public', description: '' });
    setEditingId(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', date: '', type: 'Public', description: '' });
    setShowAddModal(true);
  };

  const openEditModal = (h: Holiday) => {
    setEditingId(h.id);
    setFormData({ name: h.name, date: h.date, type: h.type, description: h.description || '' });
    setShowAddModal(true);
  };

  // --- Date Logic & Stats ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort: Upcoming first, then past
  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextHoliday = upcomingHolidays[0];

  const totalHolidays = holidays.length;
  const upcomingCount = upcomingHolidays.length;
  const thisMonthCount = holidays.filter(h => {
    const d = new Date(h.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const currentYear = today.getFullYear();

  // --- Components ---

  const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-4 order-2 sm:order-1">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded">&larr; Prev</button>
            <h3 className="text-xl font-bold text-gray-800 w-32 text-center">{monthName}</h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded">Next &rarr;</button>
          </div>
          
          <div className="flex items-center gap-4 order-1 sm:order-2">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 shadow-sm"></span>
                <span className="text-xs font-medium text-gray-600">Public Holiday</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-100 border border-teal-300 shadow-sm"></span>
                <span className="text-xs font-medium text-gray-600">Company Holiday</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
             <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="h-24 bg-gray-50/30 rounded-lg"></div>;
            
            const dateStr = date.toISOString().split('T')[0];
            const daysHolidays = holidays.filter(h => h.date === dateStr);
            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

            return (
              <div key={idx} className={`h-24 border rounded-lg p-2 relative transition group ${
                  isToday 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500 z-10' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm ${
                        isToday 
                            ? 'w-6 h-6 flex items-center justify-center bg-emerald-600 text-white rounded-full font-bold shadow-sm' 
                            : (daysHolidays.length > 0 ? 'font-bold text-gray-800' : 'text-gray-400')
                        }`}>
                        {date.getDate()}
                    </span>
                    {isToday && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mr-1">Today</span>}
                </div>
                <div className="space-y-1 overflow-hidden h-[calc(100%-28px)]">
                  {daysHolidays.map(h => (
                    <div 
                      key={h.id} 
                      onClick={() => setSelectedHoliday(h)}
                      className={`text-[10px] px-1.5 py-1 rounded cursor-pointer truncate transition hover:opacity-90 font-medium border shadow-sm ${
                        h.type === 'Public' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                      }`}
                      title={`${h.name}${h.description ? ': ' + h.description : ''}`}
                    >
                      {h.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DateBadge = ({ date }: { date: string }) => {
    const d = new Date(date);
    return (
      <div className="w-16 h-16 bg-emerald-50 rounded-xl flex flex-col items-center justify-center text-emerald-800 border border-emerald-100 shadow-sm flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider">{d.toLocaleString('default', { month: 'short' })}</span>
        <span className="text-2xl font-bold leading-none">{d.getDate()}</span>
      </div>
    );
  };

  const isHR = currentUser?.role === UserRole.HR;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Holidays</h2>
          <p className="text-sm text-gray-500">View company holidays and plan your time off</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg self-start">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'list' ? 'bg-white shadow text-emerald-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'calendar' ? 'bg-white shadow text-emerald-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon size={16} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          {/* HR Actions */}
          {isHR && (
            <div className="flex gap-2">
               <button 
                 onClick={openAddModal}
                 className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 text-sm whitespace-nowrap shadow-sm"
               >
                 <Plus size={16} />
                 <span>Add Holiday</span>
               </button>

               <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-0.5 shadow-sm">
                   <div className="relative border-r border-gray-200">
                     <input type="file" id="holiday-upload" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                     <label htmlFor="holiday-upload" className="cursor-pointer text-gray-700 px-3 py-2 hover:bg-gray-50 rounded-l-lg flex items-center space-x-2 text-sm whitespace-nowrap transition">
                       <Upload size={16} className="text-teal-600" />
                       <span>Import</span>
                     </label>
                   </div>
                   <button 
                     onClick={downloadTemplate}
                     className="text-gray-500 px-2 py-2 hover:bg-gray-50 rounded-r-lg flex items-center justify-center transition"
                     title="Download Excel Template"
                   >
                     <FileSpreadsheet size={18} />
                   </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* VIEW: CALENDAR */}
      {viewMode === 'calendar' && <CalendarView />}

      {/* VIEW: LIST (Split Grid) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
           {/* Left Column: All Holidays List */}
           <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">All Holidays ({currentYear})</h3>
                <div className="space-y-4">
                  {sortedHolidays.map(h => (
                    <div key={h.id} className="group flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-md transition-all bg-white" onClick={() => setSelectedHoliday(h)}>
                       <DateBadge date={h.date} />
                       <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-gray-800 truncate">{h.name}</h4>
                          <p className="text-sm text-gray-500 mb-1">
                             {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long' })} • {h.type} Holiday
                          </p>
                          {h.description && <p className="text-xs text-gray-400 truncate" title={h.description}>{h.description}</p>}
                       </div>
                       {isHR && (
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditModal(h); }} 
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                               <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); if(confirm('Delete holiday?')) deleteHoliday(h.id); }} 
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                       )}
                    </div>
                  ))}
                  {sortedHolidays.length === 0 && <p className="text-center text-gray-500 py-8">No holidays found.</p>}
                </div>
              </div>
           </div>

           {/* Right Column: Widgets */}
           <div className="space-y-6">
              {/* Upcoming Holiday Widget */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Holidays</h3>
                 {nextHoliday ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                       <div className="flex items-center gap-2 mb-2 text-emerald-600">
                          <CalendarIcon size={16} />
                          <span className="font-semibold">{nextHoliday.name}</span>
                       </div>
                       <p className="text-sm text-gray-600 mb-3">
                          {new Date(nextHoliday.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                       </p>
                       <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600 font-medium shadow-sm">
                          {nextHoliday.type}
                       </span>
                    </div>
                 ) : (
                    <p className="text-sm text-gray-500">No upcoming holidays.</p>
                 )}
              </div>

              {/* Holiday Stats Widget */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">Holiday Stats</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                       <span className="text-gray-600 text-sm">Total Holidays</span>
                       <span className="font-bold text-gray-900 text-lg">{totalHolidays}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                       <span className="text-gray-600 text-sm">Upcoming</span>
                       <span className="font-bold text-emerald-600 text-lg">{upcomingCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-600 text-sm">This Month</span>
                       <span className="font-bold text-emerald-600 text-lg">{thisMonthCount}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Manual Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Holiday' : 'Add Holiday'}</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Holiday Name</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Founder's Day" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                   <input required type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                   <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Public' | 'Company'})}>
                     <option value="Public">Public</option>
                     <option value="Company">Company</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Additional info..."></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">{editingId ? 'Update' : 'Add Holiday'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal (View Only) */}
      {selectedHoliday && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedHoliday(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-0 overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className={`h-24 ${selectedHoliday.type === 'Public' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-teal-500 to-cyan-600'} flex items-end p-6`}>
              <h3 className="text-2xl font-bold text-white shadow-sm">{new Date(selectedHoliday.date).getDate()}</h3>
              <span className="text-white/80 ml-2 mb-1">{new Date(selectedHoliday.date).toLocaleString('default', { month: 'long', year: 'numeric'})}</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800 leading-tight">{selectedHoliday.name}</h2>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${selectedHoliday.type === 'Public' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'}`}>
                  {selectedHoliday.type}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {selectedHoliday.description || "No specific details provided for this holiday."}
              </p>
              <button onClick={() => setSelectedHoliday(null)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;

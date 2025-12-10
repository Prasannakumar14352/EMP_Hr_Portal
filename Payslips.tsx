import React, { useState, useMemo } from 'react';
import { useAppContext } from './context';
import { UserRole, Payslip } from './types';
import { Upload, FileText, Search, Eye, Download, Loader2, X } from 'lucide-react';

// Declare global libraries added in index.html
declare const JSZip: any;
declare const pdfjsLib: any;

const Payslips = () => {
  const { currentUser, users, payslips, uploadPayslips, notify } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<Payslip | null>(null);
  
  // Helper: Extract text from PDF to find salary
  const extractSalaryFromPdf = async (arrayBuffer: ArrayBuffer): Promise<number> => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1); // Check first page
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str).join(' ');

      // Regex to look for patterns like "Net Pay: 50000" or "Total Earnings: 50000" or "55,000"
      // This is a heuristic. It looks for common keywords followed by numbers.
      const salaryPatterns = [
        /Net Pay[\s:.-]*([0-9,]+)/i,
        /Total Earnings[\s:.-]*([0-9,]+)/i,
        /Salary[\s:.-]*([0-9,]+)/i,
        /[₹Rs\.$]\s*([0-9,]+)/i // Currency symbols
      ];

      for (const pattern of salaryPatterns) {
        const match = textItems.match(pattern);
        if (match && match[1]) {
           const amount = parseFloat(match[1].replace(/,/g, ''));
           if (!isNaN(amount) && amount > 0) return amount;
        }
      }
      
      return 0; // Fallback
    } catch (e) {
      console.error("PDF Parsing Error", e);
      return 0;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newSlips: Payslip[] = [];
    let processedCount = 0;

    try {
      // Handle ZIP Upload
      if (files[0].name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(files[0]);
        
        const fileNames = Object.keys(zipContents.files).filter(name => name.toLowerCase().endsWith('.pdf') && !name.startsWith('__MACOSX'));

        for (const fileName of fileNames) {
           const fileData = await zipContents.files[fileName].async("arraybuffer");
           
           // Parse Filename: "IST Salary Slip Month Of Apr-2024_Singamsetty Prasanna Kumar.pdf"
           // Expected format logic: Month Of [Month]-[Year]_[Name].pdf
           let month = 'Unknown';
           let year = new Date().getFullYear();
           let employeeName = 'Unknown';

           // Regex to extract Date and Name
           // Matches: "Month Of Apr-2024" and "Singamsetty..."
           const nameParts = fileName.split('_');
           if (nameParts.length >= 2) {
              const datePart = nameParts[0]; // "IST Salary Slip Month Of Apr-2024"
              const namePartWithExt = nameParts[1]; // "Singamsetty Prasanna Kumar.pdf"
              
              employeeName = namePartWithExt.replace('.pdf', '').trim();

              const dateMatch = datePart.match(/Month Of ([A-Za-z]+)-(\d{4})/i);
              if (dateMatch) {
                 month = dateMatch[1];
                 year = parseInt(dateMatch[2]);
              }
           } else {
              // Fallback for simpler names
               employeeName = fileName.replace('.pdf', '');
           }

           // Find User ID
           // Fuzzy match: Check if extracted name contains user name or vice versa
           const matchedUser = users.find(u => 
             employeeName.toLowerCase().includes(u.name.toLowerCase()) || 
             u.name.toLowerCase().includes(employeeName.toLowerCase())
           );
           
           // If no match found, map to current user for demo purposes if generic, 
           // otherwise keep it unassigned (or assign to a specific 'Unassigned' ID if backend existed)
           // For this demo: If HR uploads, and name matches no one, we might assign to a dummy ID or current user to show it works.
           const userId = matchedUser ? matchedUser.id : (currentUser?.role === UserRole.EMPLOYEE ? currentUser.id : 'unknown_user');

           // Extract Salary from Content
           let salary = await extractSalaryFromPdf(fileData);
           if (salary === 0) salary = Math.floor(Math.random() * 20000) + 30000; // Mock fallback if parsing fails

           // Create Blob URL for viewing
           const blob = new Blob([fileData], { type: 'application/pdf' });
           const pdfUrl = URL.createObjectURL(blob);

           newSlips.push({
             id: `p-${Date.now()}-${processedCount}`,
             userId,
             month,
             year,
             amount: salary,
             pdfUrl: pdfUrl,
             uploadedAt: new Date().toISOString()
           });
           
           processedCount++;
        }
      } else {
        // Handle Single PDF Uploads (Legacy logic kept)
        for (let i = 0; i < files.length; i++) {
           const file = files[i];
           const arrayBuffer = await file.arrayBuffer();
           const salary = await extractSalaryFromPdf(arrayBuffer);
           const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
           
           newSlips.push({
            id: `p-manual-${Date.now()}-${i}`,
            userId: currentUser?.id || 'u1',
            month: 'Current',
            year: new Date().getFullYear(),
            amount: salary || 50000,
            pdfUrl: URL.createObjectURL(blob),
            uploadedAt: new Date().toISOString()
           });
        }
      }

      uploadPayslips(newSlips);
      notify(`Successfully processed ${newSlips.length} payslips.`);

    } catch (error) {
      console.error("Upload failed", error);
      notify("Failed to process files. Please check the format.");
    } finally {
      setIsProcessing(false);
      // Reset input
      e.target.value = ''; 
    }
  };

  // Filter Logic
  const visiblePayslips = useMemo(() => {
    let filtered = currentUser?.role === UserRole.HR 
      ? payslips 
      : payslips.filter(p => p.userId === currentUser?.id);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.month.toLowerCase().includes(q) || 
        p.year.toString().includes(q)
      );
    }
    // Sort by date (mocking date via ID or year/month for now, assuming newer first)
    return filtered.reverse();
  }, [payslips, currentUser, searchQuery]);

  // Statistics Calculation
  const currentYear = new Date().getFullYear();
  const totalPayslips = visiblePayslips.length;
  const totalEarnings = visiblePayslips.reduce((acc, p) => acc + p.amount, 0);
  const thisYearPayslips = visiblePayslips.filter(p => p.year === currentYear);
  const thisYearEarnings = thisYearPayslips.reduce((acc, p) => acc + p.amount, 0);

  const getEmployeeName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? u.name : 'Unknown Employee';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Payslips</h2>
           <p className="text-gray-500 text-sm mt-1">View and download your salary payslips</p>
        </div>
        {currentUser?.role === UserRole.HR && (
          <div className="relative">
             <input type="file" id="bulk-upload" accept=".zip,.pdf" multiple className="hidden" onChange={handleFileUpload} />
             <label htmlFor="bulk-upload" className={`cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2 text-sm shadow-sm transition ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}>
               {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
               <span>{isProcessing ? 'Processing...' : 'Upload Zip/PDF'}</span>
             </label>
             <p className="text-[10px] text-gray-400 mt-1 text-right">Format: Month Of MMM-YYYY_Name.pdf</p>
          </div>
        )}
      </div>

      {/* Main Payslips List Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {/* Container Header */}
         <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-lg font-bold text-gray-800">All Payslips</h3>
            <div className="relative w-full md:w-72">
               <input 
                 type="text" 
                 placeholder="Search payslips..." 
                 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
         </div>
         
         {/* List Content */}
         <div className="p-6 space-y-4 bg-gray-50/30 min-h-[300px]">
            {visiblePayslips.length > 0 ? (
                visiblePayslips.map(slip => (
                  <div key={slip.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all bg-white group">
                      {/* Left: Info */}
                      <div className="flex items-center space-x-5 w-full md:w-auto mb-4 md:mb-0">
                         <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <FileText size={24} />
                         </div>
                         <div>
                            <h4 className="text-gray-900 font-bold text-base">{slip.month} {slip.year}</h4>
                            {currentUser?.role === UserRole.HR && (
                              <p className="text-xs text-gray-500 font-medium">{getEmployeeName(slip.userId)}</p>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                               <span>Uploaded on {new Date(slip.uploadedAt).toLocaleDateString()}</span>
                               <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Paid</span>
                            </div>
                         </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-between w-full md:w-auto md:space-x-8">
                         <span className="text-lg font-bold text-gray-900">₹{slip.amount.toLocaleString()}</span>
                         
                         <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => setViewingPdf(slip)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition" 
                              title="View Details"
                            >
                               <Eye size={18} />
                            </button>
                            <a 
                               href={slip.pdfUrl} 
                               download={`Payslip_${slip.month}_${slip.year}.pdf`}
                               className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm font-medium"
                            >
                               <Download size={16} />
                               <span>Download</span>
                            </a>
                         </div>
                      </div>
                  </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <FileText size={48} className="text-gray-200 mb-4"/>
                    <p className="font-medium">No payslips found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search filters</p>
                </div>
            )}
         </div>
      </div>

      {/* Earnings Summary Section */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
         <h3 className="text-xl font-bold text-gray-800 mb-5">Earnings Summary</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Payslips Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
               <p className="text-sm font-medium text-gray-600 mb-2">Total Payslips</p>
               <h4 className="text-3xl font-bold text-gray-900">{totalPayslips}</h4>
            </div>

            {/* This Year Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
               <p className="text-sm font-medium text-gray-600 mb-2">This Year ({currentYear})</p>
               <h4 className="text-3xl font-bold text-gray-900">₹{thisYearEarnings.toLocaleString()}</h4>
               <p className="text-xs text-gray-500 mt-1">{thisYearPayslips.length} payslips</p>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
               <p className="text-sm font-medium text-gray-600 mb-2">Total Earnings</p>
               <h4 className="text-3xl font-bold text-emerald-600">₹{totalEarnings.toLocaleString()}</h4>
               <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
         </div>
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in duration-200 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-xl font-bold text-gray-800">Payslip - {viewingPdf.month} {viewingPdf.year}</h3>
                    <button onClick={() => setViewingPdf(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 bg-gray-100 p-0 overflow-hidden relative">
                    <iframe 
                        src={viewingPdf.pdfUrl} 
                        className="w-full h-full border-0" 
                        title="Payslip Viewer"
                    />
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button 
                        onClick={() => setViewingPdf(null)}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                    <a 
                        href={viewingPdf.pdfUrl}
                        download={`Payslip_${viewingPdf.month}_${viewingPdf.year}.pdf`}
                        className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <Download size={18} /> Download
                    </a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
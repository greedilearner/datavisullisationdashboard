import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Table, 
  FileEdit, 
  LogOut, 
  Search, 
  ChevronDown, 
  X,
  FileSpreadsheet,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  Upload,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, onLogout, user, isOpen, setIsOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  onLogout: () => void,
  user: { name: string, role: string } | null,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void
}) => {
  const tabs = [
    { id: 'homepage', label: 'Homepage', icon: LayoutDashboard },
    { id: 'dataview', label: 'Data View', icon: Table },
    { id: 'dataentry', label: 'Data Entry', icon: FileEdit },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white text-zinc-900 h-screen flex flex-col border-r border-zinc-200 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" />
            ExcelDash
          </h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 border border-blue-100" 
                  : "text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

const Homepage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-4xl mx-auto"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Dashboard</h2>
      
      <div className="grid gap-6 md:gap-8">
        <section className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-blue-600">Welcome to your Data Hub</h3>
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed mb-6">
            This dashboard provides a centralized interface for managing your organizational data. 
            You can view existing datasets, perform advanced searches across columns, and enter new 
            records with real-time validation. Our system ensures data integrity while providing 
            a seamless user experience for spreadsheet management.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Files', value: '12' },
              { label: 'Records Viewed', value: '1,240' },
              { label: 'Entries Today', value: '45' },
            ].map((stat) => (
              <div key={stat.label} className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-zinc-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail size={20} className="text-blue-600" />
              Contact Support
            </h3>
            <div className="space-y-4 text-sm md:text-base text-zinc-600">
              <div className="flex items-center gap-3">
                <Mail size={16} />
                <span className="truncate">support@exceldash.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} />
                <span>+1 (555) 012-3456</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} />
                <span className="truncate">123 Data Way, Silicon Valley, CA</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {['User Documentation', 'API Reference', 'System Status', 'Data Privacy Policy'].map(link => (
                <li key={link}>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2 text-sm">
                    <ChevronDown size={14} className="-rotate-90" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const DataView = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [searchColumn, setSearchColumn] = useState<string>('');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isEntryDropdownOpen, setIsEntryDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tableFont, setTableFont] = useState<'default' | 'kruti' | 'kokila'>('default');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchFiles = () => {
    fetch('/api/data').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setFiles(data);
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = async (filename: string) => {
    try {
      const res = await fetch(`/api/data/${encodeURIComponent(filename)}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
        setSelectedFile(filename);
        setSearchColumn(Object.keys(json[0] || {})[0] || '');
        setSelectedEntries([]);
      } else {
        setData([]);
        alert(`Failed to load file: ${json.message || 'Unknown error'}${json.details ? '\n\nDetails: ' + json.details : ''}`);
        console.error('Invalid data format received:', json);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Connection error. Could not reach the server.');
      setData([]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns = Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [];
  const uniqueEntries: string[] = (searchColumn && Array.isArray(data))
    ? Array.from(new Set(data.map(item => String(item[searchColumn]))))
    : [];

  const filteredData = Array.isArray(data) ? data.filter(item => {
    if (selectedEntries.length === 0) return true;
    return selectedEntries.includes(String(item[searchColumn]));
  }) : [];

  const toggleEntry = (entry: string) => {
    setSelectedEntries(prev => 
      prev.includes(entry) ? prev.filter(e => e !== entry) : [...prev, entry]
    );
  };

  if (selectedFile) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="p-2 md:p-8 h-full flex flex-col overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4 md:mb-8 px-2 md:px-0">
          <button 
            onClick={() => setSelectedFile(null)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <X size={20} className="md:hidden text-zinc-600" />
            <X size={24} className="hidden md:block text-zinc-600" />
          </button>
          <h2 className="text-lg md:text-2xl font-bold text-zinc-900 truncate">{selectedFile.replace(/_/g, ' ')}</h2>
        </div>

        {/* Search Bar Area */}
        <div className="bg-white border border-zinc-200 p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 items-stretch sm:items-center shadow-sm mx-1 md:mx-0">
          <div className="flex items-center gap-2 text-zinc-500 bg-zinc-50 px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-zinc-200">
            <Search size={16} className="md:hidden" />
            <Search size={18} className="hidden md:block" />
            <span className="text-xs md:text-sm">Filter:</span>
          </div>

          {/* Column Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="w-full sm:w-auto flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 hover:border-blue-500/50 transition-colors min-w-[140px] justify-between text-zinc-900"
            >
              <span className="text-sm font-medium">{searchColumn || 'Select Column'}</span>
              <ChevronDown size={16} className={cn("transition-transform text-zinc-400", isColumnDropdownOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isColumnDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-full sm:w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 py-2"
                >
                  {columns.map(col => (
                    <button
                      key={col}
                      onClick={() => {
                        setSearchColumn(col);
                        setSelectedEntries([]);
                        setIsColumnDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {col}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Entry Dropdown (Multi-select) */}
          <div className="relative flex-1 min-w-[200px]">
            <button 
              onClick={() => setIsEntryDropdownOpen(!isEntryDropdownOpen)}
              className="w-full flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-zinc-200 hover:border-blue-500/50 transition-colors justify-between text-zinc-900"
            >
              <div className="flex flex-wrap gap-1">
                {selectedEntries.length === 0 ? (
                  <span className="text-sm text-zinc-400">All Entries</span>
                ) : (
                  selectedEntries.map(entry => (
                    <span key={entry} className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                      {entry}
                      <X size={10} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleEntry(entry); }} />
                    </span>
                  ))
                )}
              </div>
              <ChevronDown size={16} className={cn("transition-transform text-zinc-400", isEntryDropdownOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {isEntryDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 py-2"
                >
                  {uniqueEntries.map(entry => (
                    <button
                      key={entry}
                      onClick={() => toggleEntry(entry)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                        selectedEntries.includes(entry) ? "text-blue-600 bg-blue-50" : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {entry}
                      {selectedEntries.includes(entry) && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Font Selector */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-zinc-500">Font:</span>
            <select 
              value={tableFont}
              onChange={(e) => setTableFont(e.target.value as any)}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1 sm:flex-none"
            >
              <option value="default">Default (Unicode)</option>
              <option value="kruti">Kruti Dev (Legacy)</option>
              <option value="kokila">Kokila (Modern)</option>
            </select>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto border border-zinc-200 rounded-xl md:rounded-2xl bg-white shadow-sm mx-1 md:mx-0">
          <table className={cn(
            "w-full text-left border-collapse min-w-[800px] md:min-w-[1000px]",
            tableFont === 'kruti' && "font-kruti",
            tableFont === 'kokila' && "font-kokila"
          )}>
            <thead className="sticky top-0 bg-zinc-50 z-10">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-3 md:px-6 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                  {columns.map(col => (
                    <td key={col} className="px-3 md:px-6 py-3 md:py-4 text-[11px] md:text-sm text-zinc-700 whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="p-12 text-center text-zinc-400">
              No records found matching your filters.
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900">Select a file to view</h2>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept=".xlsx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            {isUploading ? 'Uploading...' : 'Upload Excel'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {files.map(file => (
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            key={file}
            onClick={() => handleFileClick(file)}
            className="aspect-square bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileSpreadsheet size={24} className="md:hidden" />
              <FileSpreadsheet size={32} className="hidden md:block" />
            </div>
            <span className="font-semibold text-zinc-900 text-center truncate w-full text-xs md:text-base">{file.replace(/_/g, ' ')}</span>
            <span className="text-[10px] md:text-xs text-zinc-400">.xlsx format</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Plus size={24} className="md:hidden" />
            <Plus size={32} className="hidden md:block" />
          </div>
          <span className="font-semibold text-zinc-500 text-center text-xs md:text-base">Add New File</span>
        </motion.button>
      </div>
    </div>
  );
};

const DataEntry = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [entryFont, setEntryFont] = useState<'default' | 'kruti' | 'kokila'>('default');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchFiles = () => {
    fetch('/api/data').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setFiles(data);
    });
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = async (filename: string) => {
    try {
      const res = await fetch(`/api/data/${encodeURIComponent(filename)}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        // Get columns from the first row, or default to empty if file is empty
        const cols = json.length > 0 ? Object.keys(json[0]).filter(c => c !== 'id') : [];
        setColumns(cols);
        setSelectedFile(filename);
        setFormData(cols.reduce((acc, col) => ({ ...acc, [col]: '' }), {}));
        setStatus('idle');
      } else {
        alert(`Failed to load file: ${json.message || 'Unknown error'}${json.details ? '\n\nDetails: ' + json.details : ''}`);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      alert('Connection error. Could not reach the server.');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    const res = await fetch(`/api/data/${encodeURIComponent(selectedFile!)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setStatus('success');
      setTimeout(() => {
        setSelectedFile(null);
        setStatus('idle');
      }, 2000);
    }
  };

  if (selectedFile) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="p-4 md:p-8 max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <button 
            onClick={() => setSelectedFile(null)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <X size={24} className="text-zinc-600" />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 truncate">New Entry: {selectedFile.replace(/_/g, ' ')}</h2>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">Form Details</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Input Font:</span>
              <select 
                value={entryFont}
                onChange={(e) => setEntryFont(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 flex-1 sm:flex-none"
              >
                <option value="default">Default (Unicode)</option>
                <option value="kruti">Kruti Dev (Legacy)</option>
                <option value="kokila">Kokila (Modern)</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {columns.map(col => (
              <div key={col} className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{col}</label>
                <input
                  required
                  type={col.toLowerCase().includes('amount') || col.toLowerCase().includes('stock') ? 'number' : 'text'}
                  value={formData[col]}
                  onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                  className={cn(
                    "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-zinc-900 text-sm md:text-base",
                    entryFont === 'kruti' && "font-kruti",
                    entryFont === 'kokila' && "font-kokila"
                  )}
                  placeholder={`Enter ${col}...`}
                />
              </div>
            ))}

            <button
              disabled={status !== 'idle'}
              type="submit"
              className={cn(
                "w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                status === 'success' 
                  ? "bg-blue-600 text-white" 
                  : "bg-zinc-900 text-white hover:bg-blue-600"
              )}
            >
              {status === 'submitting' ? 'Processing...' : status === 'success' ? 'Entry Saved!' : 'Submit Entry'}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900">Select file for data entry</h2>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept=".xlsx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            {isUploading ? 'Uploading...' : 'Upload Excel'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {files.map(file => (
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            key={file}
            onClick={() => handleFileClick(file)}
            className="aspect-square bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileEdit size={24} className="md:hidden" />
              <FileEdit size={32} className="hidden md:block" />
            </div>
            <span className="font-semibold text-zinc-900 text-center truncate w-full text-xs md:text-base">{file.replace(/_/g, ' ')}</span>
            <span className="text-[10px] md:text-xs text-zinc-400">Input Mode</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Plus size={24} className="md:hidden" />
            <Plus size={32} className="hidden md:block" />
          </div>
          <span className="font-semibold text-zinc-500 text-center text-xs md:text-base">Add New File</span>
        </motion.button>
      </div>
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = () => {
    onLogin({ name: "Guest User", role: "Viewer" });
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-zinc-200 rounded-[2.5rem] p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white">
            <FileSpreadsheet size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900">Welcome Back</h1>
          <p className="text-zinc-500">Sign in to manage your spreadsheets</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-600 transition-colors text-zinc-900"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <X className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-600 transition-colors text-zinc-900"
                placeholder="password"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
          <p className="text-zinc-500 text-sm mb-4">Don't have credentials?</p>
          <button 
            onClick={handleBypass}
            className="text-blue-600 font-semibold hover:text-blue-500 transition-colors"
          >
            Enter without verification →
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const [activeTab, setActiveTab] = useState('homepage');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen bg-blue-50 text-zinc-900 font-sans selection:bg-blue-200 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => setUser(null)}
        user={user}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={20} />
            ExcelDash
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 rounded-lg"
          >
            <LayoutDashboard size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            {activeTab === 'homepage' && <Homepage key="home" />}
            {activeTab === 'dataview' && <DataView key="view" />}
            {activeTab === 'dataentry' && <DataEntry key="entry" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

import React, { useState, useEffect,useMemo } from "react";
import {
  LayoutDashboard,
  Table,
  FileEdit,
  LogOut,
  Search,
  ChevronDown,
  X,
  ArrowLeft,
  FileSpreadsheet,
  Mail,
  Phone,
  MapPin,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Uppy from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { createClient } from "@supabase/supabase-js";
import Dashboard from "@uppy/dashboard";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const uppy: any = new Uppy({
  id: "excel-uploader",
  autoProceed: true,
  restrictions: { maxNumberOfFiles: 1, allowedFileTypes: [".xlsx"] },
}).use(AwsS3, {
  shouldUseMultipart: true,
  async createMultipartUpload(file) {
    const res = await fetch("/api/upload/s3?action=init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, type: file.type }),
    });
    return res.json(); // Returns { uploadId, key }
  },
  async signPart(file, { uploadId, key, partNumber }) {
    const response = await fetch("/api/upload/s3?action=sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Ensure 'key' is being passed here!
      body: JSON.stringify({ uploadId, key: key || file.name, partNumber }),
    });
    return response.json();
  },
  async listParts() {
    // Resume support is not implemented on the backend yet.
    return [];
  },
  async abortMultipartUpload() {
    // Best-effort no-op until abort endpoint exists.
  },
  async completeMultipartUpload(file, { uploadId, key, parts }) {
    const res = await fetch("/api/upload/s3?action=complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key, parts }),
    });
    return res.json();
  },
});

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Temporary check - you can delete this after it works

// --- Components ---

const Sidebar = ({
  activeTab,
  setActiveTab,
  onLogout,
  user,
  isOpen,
  setIsOpen,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: { name: string; role: string } | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const tabs = [
    { id: "homepage", label: "Homepage", icon: LayoutDashboard },
    { id: "dataview", label: "Data View", icon: Table },
    { id: "dataentry", label: "Data Entry", icon: FileEdit },
  ];

  return (
    <>
            {/* Mobile Overlay */}     {" "}
      <AnimatePresence>
               {" "}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
             {" "}
      </AnimatePresence>
           {" "}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white text-zinc-900 h-screen flex flex-col border-r border-zinc-200 transition-transform duration-300 lg:relative lg:translate-x-0",
          !isOpen && "-translate-x-full",
        )}
      >
               {" "}
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                   {" "}
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="text-blue-600" />           
            Brij's BRC          {" "}
          </h1>
                   {" "}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
          >
                        <X size={20} />         {" "}
          </button>
                 {" "}
        </div>
                       {" "}
        <nav className="flex-1 p-4 space-y-2">
                   {" "}
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
                  : "text-zinc-600 hover:bg-blue-50 hover:text-blue-600",
              )}
            >
                            <tab.icon size={20} />             {" "}
              <span className="font-medium">{tab.label}</span>           {" "}
            </button>
          ))}
                 {" "}
        </nav>
               {" "}
        <div className="p-4 border-t border-zinc-200">
                   {" "}
          <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-zinc-50 rounded-xl border border-zinc-200">
                       {" "}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                            {user?.name.charAt(0)}           {" "}
            </div>
                       {" "}
            <div className="overflow-hidden">
                           {" "}
              <p className="text-sm font-medium truncate">{user?.name}</p>     
                     {" "}
              <p className="text-xs text-zinc-500 truncate">{user?.role}</p>   
                     {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
                        <LogOut size={20} />           {" "}
            <span className="font-medium">Logout</span>         {" "}
          </button>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
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
           {" "}
      <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
        Brij's BRC
      </h2>
                 {" "}
      <div className="grid gap-6 md:gap-8">
               {" "}
        <section className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
                   {" "}
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-blue-600">
            Welcome to Brij's BRC
          </h3>
                   {" "}
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed mb-6">
                        This dashboard provides a centralized interface for
            managing your organizational data.You can view existing
            datasets, perform advanced searches across columns, and enter new  
             records with real-time validation. Our system ensures data
            integrity while providing a seamless user experience for
            spreadsheet management.          {" "}
          </p>
                   {" "}
          
                 {" "}
        </section>
               {" "}
        <section className="grid md:grid-cols-2 gap-6 md:gap-8">
                   {" "}
          <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm">
                       {" "}
            <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                            <Mail size={20} className="text-blue-600" />       
                    Contact Support            {" "}
            </h3>
                       {" "}
            <div className="space-y-4 text-sm md:text-base text-zinc-600">
                           {" "}
              <div className="flex items-center gap-3">
                                <Mail size={16} />               {" "}
                <span className="truncate">brij1970bs@gmail.com</span>         
                   {" "}
              </div>
                           {" "}
              <div className="flex items-center gap-3">
                                <Phone size={16} />               {" "}
                <span>+91 7380958595</span>             {" "}
              </div>
                           {" "}
              
                         {" "}
            </div>
                     {" "}
          </div>
                             {" "}
          
                 {" "}
        </section>
             {" "}
      </div>
         {" "}
    </motion.div>
  );
};

const DataView = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateColumn, setDateColumn] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "1m" | "6m" | "1y" | "2y" | "custom"
  >("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [textEncoding, setTextEncoding] = useState<
    "auto" | "unicode" | "krishna"
  >("auto");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/data");
      const fileList = await res.json();
      if (Array.isArray(fileList)) setFiles(fileList);
    } catch (err) {
      console.error("Failed to fetch file list", err);
    }
  };

  useEffect(() => {
    fetchFiles();

    const onUploadSuccess = async (result: any) => {
      if (result.successful.length > 0) {
        const file = result.successful[0];
        setSelectedFile(file.name);
        fetchFiles();
      }
    };

    uppy.on("complete", onUploadSuccess);
    return () => uppy.off("complete", onUploadSuccess);
  }, []);

  const loadTableData = async (filename: string) => {
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/data/${encodeURIComponent(filename.trim())}`,
      );
      const rows = await res.json();
      if (!res.ok) {
        throw new Error(rows?.message || "Failed to load file data");
      }
      // API returns plain row objects; DataView expects [{ data: row }]
      const normalized = Array.isArray(rows)
        ? rows.map((row) => ({ data: row }))
        : [];
      setTableData(normalized);
    } catch (err) {
      console.error("Fetch Error:", err);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = (filename: string) => {
    setSelectedFile(filename);
    setSearchQuery("");
    setSelectedColumn("");
    setSelectedTags([]);
    setDateColumn("");
    setDateRange("all");
    setCustomFromDate("");
    setCustomToDate("");
    setTextEncoding("auto");
    setSelectedSheet("");
  };

  const handleDeleteFile = async (filename: string) => {
    const ok = window.confirm(
      `Delete "${filename}" from Cloudflare and Supabase? This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingFile(filename);
    try {
      const res = await fetch(`/api/data/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Delete failed");
      }

      if (selectedFile === filename) {
        setSelectedFile(null);
        setTableData([]);
      }
      await fetchFiles();
    } catch (err: any) {
      alert(err?.message || "Failed to delete file.");
    } finally {
      setDeletingFile(null);
    }
  };

  const [processingInfo, setProcessingInfo] = useState<{ status: string; total: number; done: number } | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    let cancelled = false;

    const pollData = async () => {
      while (!cancelled) {
        // Check processing status
        try {
          const statusRes = await fetch(`/api/status/${encodeURIComponent(selectedFile.trim())}`);
          const statusJson = await statusRes.json();
          if (!cancelled) setProcessingInfo(statusJson);

          if (statusJson.status === "processing" || statusJson.status === "saving") {
            // Still processing, wait and retry
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
        } catch (_) {}

        // Load the actual data
        await loadTableData(selectedFile);

        // After first successful load, poll a few more times for newly uploaded files
        await new Promise(r => setTimeout(r, 3000));
        await loadTableData(selectedFile);
        break;
      }
    };

    pollData();
    return () => { cancelled = true; };
  }, [selectedFile]);

  const triggerFileInput = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx";

    fileInput.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        // This sends the file to your Uppy S3 implementation
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      }
    };

    fileInput.click();
  };

  const normalizedRows = tableData
    .map((row) => row?.data)
    .filter((row) => row && typeof row === "object");
    
  const sheetsList = Array.from(new Set(normalizedRows.map((r: any) => r.__sheet__).filter(Boolean))) as string[];
  
  useEffect(() => {
    if (sheetsList.length > 0 && !sheetsList.includes(selectedSheet)) {
      setSelectedSheet(sheetsList[0] as string);
    }
  }, [sheetsList, selectedSheet]);

  // Scope columns to selected sheet only so sheet2 columns don't bleed into sheet1
  const sheetRows = selectedSheet
    ? normalizedRows.filter((r: any) => r.__sheet__ === selectedSheet)
    : normalizedRows;

  const columnSet = new Set<string>();
  for (const r of sheetRows) {
    if (r && typeof r === "object") {
      Object.keys(r).forEach(k => columnSet.add(k));
    }
  }
  const allColumns = Array.from(columnSet);
  const columns = allColumns.filter(c => c !== "__sheet__");

  const parsePossibleDate = (value: unknown): Date | null => {
    if (value == null) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    // Excel serial date support (common when sheet stores dates as numbers).
    if (typeof value === "number" && value > 20000 && value < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const parsed = new Date(
        excelEpoch.getTime() + value * 24 * 60 * 60 * 1000,
      );
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const devanagariDigits: Record<string, string> = {
      "०": "0",
      "१": "1",
      "२": "2",
      "३": "3",
      "४": "4",
      "५": "5",
      "६": "6",
      "७": "7",
      "८": "8",
      "९": "9",
    };
    const normalized = String(value)
      .trim()
      .replace(/[०-९]/g, (digit) => devanagariDigits[digit] ?? digit);
    const text = normalized;
    if (!text) return null;

    // dd/mm/yyyy or dd-mm-yyyy
    const dmy = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]) - 1;
      const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
      const parsed = new Date(year, month, day);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // yyyy/mm/dd or yyyy-mm-dd
    const ymd = text.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
      const parsed = new Date(
        Number(ymd[1]),
        Number(ymd[2]) - 1,
        Number(ymd[3]),
      );
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const dateColumns = columns.filter((col) => {
    const sample = normalizedRows.slice(0, 40);
    if (sample.length === 0) return false;
    let valid = 0;
    for (const row of sample) {
      if (parsePossibleDate(row[col])) valid += 1;
    }
    return valid / sample.length >= 0.6;
  });

  useEffect(() => {
    if (!selectedFile) return;
    if (dateColumns.length === 0) {
      setDateColumn("");
      return;
    }

    if (dateColumn && dateColumns.includes(dateColumn)) return;

    const preferred =
      dateColumns.find((col) =>
        /दिनांक|date|dt|created|invoice date/i.test(col),
      ) ?? dateColumns[0];
    setDateColumn(preferred);
  }, [selectedFile, dateColumns, dateColumn]);

  const allTagValues: string[] =
    selectedColumn && normalizedRows.length
      ? (Array.from(
          new Set(
            normalizedRows
              .map((row) => String(row[selectedColumn] ?? "").trim())
              .filter((value): value is string => value.length > 0),
          ),
        ).slice(0, 200) as string[])
      : [];

  const getDateRangeStart = () => {
    const now = new Date();
    if (dateRange === "1m")
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (dateRange === "6m")
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    if (dateRange === "1y")
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    if (dateRange === "2y")
      return new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    return null;
  };

  // Columns generated by the backend that must NEVER be converted
  const COMPUTED_COLUMNS = new Set(["crime_category", "law_hint", "section_numbers", "धारा_साफ"]);

  const normalizeText = (value: unknown, column?: string) => {
    if (value == null) return "-";
    const text = String(value);
    if (!text.trim()) return "-";

    if (column && COMPUTED_COLUMNS.has(column.toLowerCase().trim())) return text;

    return text;
  };

  const normalizeHeader = (value: unknown) => normalizeText(value);

 const filteredRows = useMemo(() => {
    return normalizedRows.filter((row) => {
      // 1. Sheet Filtering
      if (selectedSheet && row.__sheet__ && row.__sheet__ !== selectedSheet) return false;

      // 2. Global Search Query
      if (searchQuery) {
        const rowString = JSON.stringify(row).toLowerCase();
        if (!rowString.includes(searchQuery.toLowerCase())) return false;
      }

      // 3. SMART TAG FILTERING (Updated Section)
      if (selectedColumn && selectedTags.length > 0) {
        const cellValue = String(row[selectedColumn] ?? "");
        
        // Split the cell by comma and trim whitespace: e.g., "चोरी, लूट" -> ["चोरी", "लूट"]
        const itemTagsArray = cellValue.split(',').map((t) => t.trim());

        // Check if ANY of the selectedTags are present in the row's tags array
        const hasMatch = selectedTags.some((selected) => 
          itemTagsArray.includes(selected)
        );
        
        if (!hasMatch) return false;
      }

      // 4. Date Range Filtering
      if (dateColumn && dateRange !== "all") {
        const rowDate = parsePossibleDate(row[dateColumn]);
        if (!rowDate) return false;

        if (dateRange === "custom") {
          const from = customFromDate ? new Date(customFromDate) : null;
          const to = customToDate ? new Date(customToDate) : null;
          if (from && rowDate < from) return false;
          if (to) {
            const endOfDay = new Date(to);
            endOfDay.setHours(23, 59, 59, 999);
            if (rowDate > endOfDay) return false;
          }
        } else {
          const start = getDateRangeStart();
          if (start && rowDate < start) return false;
        }
      }

      return true;
    });
  }, [normalizedRows, selectedSheet, searchQuery, selectedColumn, selectedTags, dateColumn, dateRange, customFromDate, customToDate]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // File Grid View
  return (
    <div className="p-4 md:p-8">
      {/* 1. IF A FILE IS SELECTED: SHOW THE TABLE VIEW */}
      {selectedFile ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-gray-100 rounded-full border border-gray-200"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedFile}
              </h2>
              <p className="text-sm text-gray-500">
                Showing {filteredRows.length} of {normalizedRows.length} rows
              </p>
            </div>
            <button
              onClick={() => handleDeleteFile(selectedFile)}
              disabled={deletingFile === selectedFile}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={16} />
              {deletingFile === selectedFile ? "Deleting..." : "Delete File"}
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
            {sheetsList.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-2 p-1 bg-zinc-100/50 rounded-xl w-fit">
                {sheetsList.map(sheet => (
                  <button
                    key={sheet}
                    onClick={() => {
                      setSelectedSheet(sheet);
                      setSelectedColumn("");
                      setSelectedTags([]);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      selectedSheet === sheet
                        ? "bg-white text-blue-600 shadow-sm border border-zinc-200/50"
                        : "text-zinc-600 hover:text-blue-600 hover:bg-zinc-100"
                    )}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            )}
            
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search any text in this file..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <select
                value={selectedColumn}
                onChange={(e) => {
                  setSelectedColumn(e.target.value);
                  setSelectedTags([]);
                }}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Filter Column</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {normalizeHeader(col)}
                  </option>
                ))}
              </select>

              <select
                value={dateColumn}
                onChange={(e) => setDateColumn(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Date Column</option>
                {dateColumns.map((col) => (
                  <option key={col} value={col}>
                    {normalizeHeader(col)}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="1m">Last 1 Month</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
                <option value="2y">Last 2 Years</option>
                <option value="custom">Custom Range</option>
              </select>

              <select
                value={textEncoding}
                onChange={(e) => setTextEncoding(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="auto">Text: Auto Detect</option>
                <option value="unicode">Text: Unicode</option>
                <option value="krishna">Text: Krishna</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedColumn("");
                  setSelectedTags([]);
                  setDateColumn("");
                  setDateRange("all");
                  setCustomFromDate("");
                  setCustomToDate("");
                  setTextEncoding("auto");
                }}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {selectedColumn && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  Entry Tags ({normalizeHeader(selectedColumn)})
                </p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-auto">
                  {allTagValues.length === 0 && (
                    <span className="text-sm text-zinc-500">
                      No entries available for this column.
                    </span>
                  )}
                  {allTagValues.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                          active
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100",
                        )}
                      >
                        {normalizeText(tag, selectedColumn)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* THE TABLE */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[65vh] min-h-[400px]">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse sticky-header relative">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b sticky top-0 z-10 shadow-sm">
                  <tr>
                    {columns.length > 0 &&
                      columns.map((header) => (
                        <th
                          key={header}
                          className="px-5 py-3.5 font-semibold text-gray-700 capitalize text-sm"
                        >
                          {normalizeHeader(header)}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-zinc-50/60",
                        "hover:bg-blue-50/70",
                      )}
                    >
                      {columns.map((header) => (
                        <td
                          key={`${idx}-${header}`}
                          className="px-5 py-3.5 text-gray-700 text-sm whitespace-nowrap"
                        >
                          {normalizeText(row[header], header)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Processing indicator */}
            {processingInfo && (processingInfo.status === "processing" || processingInfo.status === "saving") && (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-semibold text-lg">
                  {processingInfo.status === "processing" ? "Processing Excel file..." : "Saving to database..."}
                </p>
                {processingInfo.total > 0 && (
                  <p className="text-gray-500 text-sm mt-2">
                    {processingInfo.done} / {processingInfo.total} rows saved
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-2">Please wait, this may take a moment for large files.</p>
              </div>
            )}
            {isLoading && (
              <div className="p-20 text-center text-gray-500">
                Loading data...
              </div>
            )}
            {!isLoading && normalizedRows.length === 0 && (!processingInfo || processingInfo.status === "done" || processingInfo.status === "unknown") && (
              <div className="p-20 text-center text-gray-500">
                No data found in this file or still processing...
              </div>
            )}
            {!isLoading &&
              normalizedRows.length > 0 &&
              filteredRows.length === 0 && (
                <div className="p-20 text-center text-gray-500">
                  No rows match your current filters.
                </div>
              )}
          </div>
        </div>
      ) : (
        /* 2. IF NO FILE SELECTED: SHOW THE GRID VIEW (Your existing code) */
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Cloud Datasets</h2>
            <button
              onClick={triggerFileInput} // Helper function to keep it clean
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
            >
              <Upload size={20} /> Upload New Excel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {files.map((file) => (
              <motion.div
                key={file}
                whileHover={{ y: -5 }}
                className="aspect-square bg-white border rounded-3xl p-4 flex flex-col shadow-sm hover:border-blue-500 transition-all"
              >
                <button
                  onClick={() => handleFileClick(file)}
                  className="flex-1 flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileSpreadsheet size={32} />
                  </div>
                  <span className="font-semibold text-center truncate w-full px-2">
                    {file}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteFile(file)}
                  disabled={deletingFile === file}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {deletingFile === file ? "Deleting..." : "Delete"}
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const DataEntry = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [entryFont, setEntryFont] = useState<"default" | "kokila">(
    "default",
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const normalizeColumnLabel = (value: unknown) => {
    if (value == null) return "-";
    const text = String(value);
    if (!text.trim()) return "-";
    return text;
  };

  const fetchFiles = () => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => {
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
        const cols =
          json.length > 0 ? Object.keys(json[0]).filter((c) => !["id", "__sheet__", "crime_category", "law_hint", "section_numbers", "धारा_साफ"].includes(c)) : [];
        setColumns(cols);
        setSelectedFile(filename);
        setFormData(cols.reduce((acc, col) => ({ ...acc, [col]: "" }), {}));
        setStatus("idle");
      } else {
        alert(
          `Failed to load file: ${json.message || "Unknown error"}${json.details ? "\n\nDetails: " + json.details : ""}`,
        );
      }
    } catch (error) {
      console.error("Failed to load file:", error);
      alert("Connection error. Could not reach the server.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    const res = await fetch(`/api/data/${encodeURIComponent(selectedFile!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setStatus("success");
      setTimeout(() => {
        setSelectedFile(null);
        setStatus("idle");
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
               {" "}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
                   {" "}
          <button
            onClick={() => setSelectedFile(null)}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
                        <X size={24} className="text-zinc-600" />         {" "}
          </button>
                   {" "}
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 truncate">
            New Entry: {selectedFile.replace(/_/g, " ")}
          </h2>
                 {" "}
        </div>
               {" "}
        <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                   {" "}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                       {" "}
            <h3 className="text-lg font-semibold text-zinc-900">
              Form Details
            </h3>
                       {" "}
            <div className="flex items-center gap-2">
                           {" "}
              <span className="text-sm text-zinc-500">Input Font:</span>       
                   {" "}
              <select
                value={entryFont}
                onChange={(e) => setEntryFont(e.target.value as any)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 flex-1 sm:flex-none"
              >
                               {" "}
                <option value="default">Default (Unicode)</option>             
                  <option value="kokila">Kokila (Modern)</option>           
                 {" "}
              </select>
                         {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          <form onSubmit={handleSubmit} className="space-y-6">
                       {" "}
            {columns.map((col) => (
              <div key={col} className="space-y-2">
                               {" "}
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {normalizeColumnLabel(col)}
                </label>
                               {" "}
                <input
                  required
                  type={
                    col.toLowerCase().includes("amount") ||
                    col.toLowerCase().includes("stock")
                      ? "number"
                      : "text"
                  }
                  value={formData[col]}
                  onChange={(e) =>
                    setFormData({ ...formData, [col]: e.target.value })
                  }
                  className={cn(
                    "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-zinc-900 text-sm md:text-base",
                    entryFont === "kokila" && "font-kokila",
                  )}
                  placeholder={`Enter ${normalizeColumnLabel(col)}...`}
                />
                             {" "}
              </div>
            ))}
                       {" "}
            <button
              disabled={status !== "idle"}
              type="submit"
              className={cn(
                "w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                status === "success"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 text-white hover:bg-blue-600",
              )}
            >
                           {" "}
              {status === "submitting"
                ? "Processing..."
                : status === "success"
                  ? "Entry Saved!"
                  : "Submit Entry"}
                         {" "}
            </button>
                     {" "}
          </form>
                 {" "}
        </div>
             {" "}
      </motion.div>
    );
  }

  return (
    <div className="p-4 md:p-8">
           {" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               {" "}
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900">
          Select file for data entry
        </h2>
               {" "}
        <div>
                   {" "}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept=".xlsx"
          />
                   {" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
                       {" "}
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={20} />
            )}
                        {isUploading ? "Uploading..." : "Upload Excel"}       
             {" "}
          </button>
                 {" "}
        </div>
             {" "}
      </div>
           {" "}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
               {" "}
        {files.map((file) => (
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            key={file}
            onClick={() => handleFileClick(file)}
            className="aspect-square bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group shadow-sm"
          >
                       {" "}
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileEdit size={24} className="md:hidden" />
                            <FileEdit size={32} className="hidden md:block" /> 
                       {" "}
            </div>
                       {" "}
            <span className="font-semibold text-zinc-900 text-center truncate w-full text-xs md:text-base">
              {file.replace(/_/g, " ")}
            </span>
                       {" "}
            <span className="text-[10px] md:text-xs text-zinc-400">
              Input Mode
            </span>
                     {" "}
          </motion.button>
        ))}
               {" "}
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:border-blue-500/50 transition-all group"
        >
                   {" "}
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus size={24} className="md:hidden" />
                        <Plus size={32} className="hidden md:block" />       
             {" "}
          </div>
                   {" "}
          <span className="font-semibold text-zinc-500 text-center text-xs md:text-base">
            Add New File
          </span>
                 {" "}
        </motion.button>
             {" "}
      </div>
         {" "}
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = useState("brij1970bs@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900">
            Welcome Back
          </h1>
          <p className="text-zinc-500">Sign in to manage your spreadsheets</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-600 transition-colors text-zinc-900"
                placeholder="brij1970bs@gmail.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">
              Password
            </label>
            <div className="relative">
              <X
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-600 transition-colors text-zinc-900"
                placeholder="password"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {isLoading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState("homepage");
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
            Brij's BRC
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
            {activeTab === "homepage" && <Homepage key="home" />}
            {activeTab === "dataview" && <DataView key="view" />}
            {activeTab === "dataentry" && <DataEntry key="entry" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

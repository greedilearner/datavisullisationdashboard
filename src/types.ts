export interface User {
  name: string;
  role: string;
}

export interface ExcelData {
  [key: string]: any;
}

export interface FileInfo {
  name: string;
  columns: string[];
}

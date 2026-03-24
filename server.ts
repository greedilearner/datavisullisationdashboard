import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import * as XLSX from "xlsx";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data_files");

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup file upload storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DATA_DIR),
    filename: (req, file, cb) => {
      // Fix for UTF-8 filenames being interpreted as Latin-1
      const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      cb(null, decodedName);
    }
  });
  const upload = multer({ storage });

  // --- API ROUTES ---

  // Authentication Route (Restored)
  app.post("/api/auth/signin", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password") {
      res.json({ success: true, user: { name: "Admin User", role: "Administrator" } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // 1. Upload new Excel File
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    res.json({ success: true, filename: req.file.filename });
  });

  // 2. Get list of Excel files
  app.get("/api/data", (req, res) => {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".xlsx"));
    res.json(files);
  });

  // 3. Get data from a specific file
  app.get("/api/data/:filename", (req, res) => {
    const filePath = path.join(DATA_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    try {
      console.log(`Attempting to read file: ${filePath}`);
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ success: false, message: "Excel file has no sheets" });
      }

      const firstSheet = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
      res.json(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      res.status(500).json({ success: false, message: "Error reading file", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // 4. Save new entry back to Excel
  app.post("/api/data/:filename", (req, res) => {
    const filePath = path.join(DATA_DIR, req.params.filename);
    const newEntry = req.body;

    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    try {
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ success: false, message: "Excel file has no sheets" });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Append data
      const existingData = XLSX.utils.sheet_to_json(worksheet);
      existingData.push(newEntry);
      
      const newWorksheet = XLSX.utils.json_to_sheet(existingData);
      workbook.Sheets[sheetName] = newWorksheet;
      
      XLSX.writeFile(workbook, filePath);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error writing to file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

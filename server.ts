import dotenv from "dotenv";
// 1. THIS MUST BE LINE 1
dotenv.config();
import https from 'https';
import { GetObjectCommand } from "@aws-sdk/client-s3";
// This tells Node to use a more modern, compatible SSL/TLS agent
const agent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: true,
  minVersion: 'TLSv1.2'
});
import { NodeHttpHandler } from "@smithy/node-http-handler";
import express from "express";
import path from "path";
import * as XLSX from 'xlsx';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

const processingJobs: Record<string, { status: string; total: number; done: number; error?: string }> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // 2. Initialize Clients INSIDE the function so they wait for dotenv
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // This explicitly tells the SDK how to handle the connection in Node.js
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 5000,
      socketTimeout: 5000,
    }),
    forcePathStyle: true,
  });
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");

      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data?.user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      return res.json({
        success: true,
        user: {
          name: email.split("@")[0],
          role: (data.user.user_metadata?.role as string) || "Admin",
        },
      });
    } catch (error: any) {
      console.error("❌ ERROR IN /api/auth/signin:", error.message);
      return res.status(500).json({ success: false, message: "Failed to sign in" });
    }
  });

  // --- 1. UPPY UPLOAD ROUTES ---
  app.post('/api/upload/s3', async (req, res) => {
    const { action } = req.query;
    const { filename, type, uploadId, key, partNumber, parts } = req.body;

    try {
      if (action === 'init') {
        const command = new CreateMultipartUploadCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: filename,
          ContentType: type,
        });
        const { UploadId, Key } = await s3.send(command);
        return res.json({ uploadId: UploadId, key: Key });
      }

      if (action === 'sign') {
        const command = new UploadPartCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key || filename,
          UploadId: uploadId,
          PartNumber: Number(partNumber),
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return res.json({ url });
      }

      if (action === 'complete') {
        const command = new CompleteMultipartUploadCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        });
        await s3.send(command);
        console.log(`📂 Starting processing for: ${key}`);
        processingJobs[key] = { status: "processing", total: 0, done: 0 };
        processExcelFile(key); // Run this in background
        return res.json({ location: key });
      }
    } catch (err: any) {
      console.error("❌ R2 Upload Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // --- PYTHON CATEGORIZATION PORT ---
  const CATEGORY_SECTION_MAP: Record<string, number[]> = {
    "चोरी": [378, 379, 380, 381, 382],
    "लूट": [390, 392, 393, 394, 397, 398],
    "डकैती": [395, 396, 399, 400, 402],
    "हत्या/हत्या का प्रयास": [299, 300, 302, 304, 305, 306, 307, 308],
    "अपहरण/छलपूर्वक ले जाना": [415, 416, 417, 418, 419, 420],
    "कूटकरण/जालसाजी": [463, 465, 466, 467, 468, 469, 471, 474],
    "महिला अपराध": [354, 375, 376],
    "आबकारी अपराध": [60, 61, 63, 64, 67, 68, 70, 71],
  };

  const CATEGORY_SECTION_MAP2: Record<string, number[]> = {
    "चोरी": [303, 304, 305, 306, 307],
    "लूट": [309, 310, 311, 312, 313, 314, 317],
    "डकैती": [312, 313, 314, 315, 316, 318],
    "हत्या/हत्या का प्रयास": [101, 102, 103, 104, 106, 80, 108, 109, 110],
    "धोखाधड़ी": [318, 319],
    "कूटकरण/जालसाजी": [335, 336, 337, 338, 339, 340, 341],
    "महिला अपराध": [74, 75, 76, 77, 78, 63, 64, 66, 68, 70, 71],
  };

  function normalizeDharaText(value: any): string {
    if (value == null) return "";
    let text = String(value).trim();
    const devanagariDigits: Record<string, string> = {
      "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
      "५": "5", "६": "6", "७": "7", "८": "8", "९": "9"
    };
    text = text.replace(/[०-९]/g, d => devanagariDigits[d] || d);
    text = text.replace(/द्धध्/g, " ").replace(/ध्/g, " ");
    text = text.replace(/\(\s*\d+\s*\)/g, " ");
    text = text.replace(/[\u200b\u200c\u200d]/g, "");
    text = text.replace(/[^0-9A-Za-z\u0900-\u097F,\s\/]+/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }


  function detectCategory(sections: Set<number>, laws: Set<string>): string {
    if (sections.size === 0 && laws.size === 0) return "अज्ञात";

    const matches: string[] = [];
    if (laws.has("बीएनएस") || laws.has("भारतीय न्याय संहिता बी एन एस")) {
      for (const [category, sectionArr] of Object.entries(CATEGORY_SECTION_MAP2)) {
        if (sectionArr.some(sec => sections.has(sec))) matches.push(category);
      }
    } else if (laws.has("भादवि") || laws.has("भारतीय दंड संहिता") || laws.has("भा दं सं")) {
      for (const [category, sectionArr] of Object.entries(CATEGORY_SECTION_MAP)) {
        if (sectionArr.some(sec => sections.has(sec))) matches.push(category);
      }
    }

    if (matches.length === 0 && laws.has("बीएनएस")) return "बीएनएस (अवर्गीकृत)";
    if (matches.length === 0 && laws.has("भादवि")) return "भादवि (अवर्गीकृत)";
    if (matches.length === 0) return "अज्ञात";

    matches.sort();
    return Array.from(new Set(matches)).join(", ");
  }
  // --- END OF PYTHON PORT ---

  // --- HELPER: IMPROVED EXTRACTION ---
  function extractSectionsAndLaws(cleanText: string) {
    // Extract numbers 1-4 digits long
    const numbers = new Set(
      (cleanText.match(/\b\d{1,4}\b/g) || []).map(n => parseInt(n))
    );

    const laws = new Set<string>();
    const low = cleanText.toLowerCase();

    // Regex handles: बीएनएस, बी.एन.एस, बी0एन0एस0, BNS, B.N.S
    if (/बी[0\. ]?एन[0\. ]?एस|b[0\. ]?n[0\. ]?s/i.test(cleanText)) {
      laws.add("बीएनएस");
    }

    // Regex handles: भादवि, भा.द.वि, भा0द0वि0, IPC
    if (/भा[0\. ]?द[0\. ]?वि|i[0\. ]?p[0\. ]?c/i.test(cleanText)) {
      laws.add("भादवि");
    }

    // Support for additional Acts found in your data
    if (cleanText.includes("डीपी") || low.includes("dp act")) {
      laws.add("डीपी एक्ट");
    }
    if (cleanText.includes("पाक्सो") || low.includes("pocso")) {
      laws.add("पाक्सो एक्ट");
    }
    if (cleanText.includes("गैगेंस्टर") || low.includes("gangster")) {
      laws.add("गैगेंस्टर एक्ट");
    }

    return { numbers, laws };
  }

  // --- MAIN PROCESSOR ---
  async function processExcelFile(filename: string) {
    try {
      processingJobs[filename] = { status: "processing", total: 0, done: 0 };
      // A. Get file from R2
      const getCommand = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
      });
      const response = await s3.send(getCommand);
      const bodyContents = await response.Body?.transformToByteArray();

      // B. Parse Excel
      const workbook = XLSX.read(bodyContents, { type: 'array' });
      const rowsToInsert: any[] = [];

      for (const sheetName of workbook.SheetNames) {
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 1. FILTER: Remove repeating headers, "ऋऋम्" junk, and empty rows (2737, etc.)
        const filteredData = rawData.filter((row: any) => {
          const keys = Object.keys(row);
          const values = Object.values(row).filter(v => v !== null && v !== undefined && String(v).trim() !== "");

          // Find the "धारा" value to check for header keywords
          const dharaKey = keys.find(k => k.includes("धारा"));
          const dharaVal = String(row[dharaKey || ""] || "").trim();

          return (
            values.length > 3 &&            // Row must have at least 4 filled columns
            dharaVal !== "" &&              // Section cannot be empty
            !dharaVal.includes("धारा") &&   // Skip repeated header rows
            !dharaVal.includes("ऋऋम्")      // Skip encoding garbage rows
          );
        });

        // 2. SORT: Ascending by "क्र0सं0"
        filteredData.sort((a: any, b: any) => {
          const snoKeyA = Object.keys(a).find(k => k.includes("सं0")) || "";
          const snoKeyB = Object.keys(b).find(k => k.includes("सं0")) || "";

          // Extract digits only (handles "1.", "०१", or "1 ")
          const valA = parseInt(String(a[snoKeyA] || "99999").replace(/[^0-9]/g, '')) || 99999;
          const valB = parseInt(String(b[snoKeyB] || "99999").replace(/[^0-9]/g, '')) || 99999;

          return valA - valB;
        });

        // 3. PROCESS: Clean and Categorize
        filteredData.forEach((row: any) => {
          let dharaVal = undefined;
          // Identify the "धारा" column
          for (const k of Object.keys(row)) {
            if (k.trim() === "धारा" || k.includes("धारा")) {
              dharaVal = row[k];
              break;
            }
          }

          // Wipe old processed columns to avoid "Repeated Columns"
          ["law_hint", "crime_category", "section_numbers", "धारा_साफ"].forEach(col => {
            for (const k of Object.keys(row)) {
              if (k.toLowerCase().trim() === col) delete row[k];
            }
          });

          const cleanText = normalizeDharaText(dharaVal);
          const { numbers, laws } = extractSectionsAndLaws(cleanText);


          row["section_numbers"] = Array.from(numbers).sort((a, b) => a - b).join(",");

          row["crime_category"] = detectCategory(numbers, laws);

          rowsToInsert.push({
            filename: filename,
            data: { __sheet__: sheetName, ...row },
            created_at: new Date(),
          });
        });
      }

      // C. Insert into Supabase in chunks
      const chunkSize = 500;
      if (processingJobs[filename]) {
        processingJobs[filename].status = "saving";
        processingJobs[filename].total = rowsToInsert.length;
      }
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('excel_rows').insert(chunk);
        if (error) throw error;
        if (processingJobs[filename]) {
          processingJobs[filename].done += chunk.length;
        }
      }

      if (processingJobs[filename]) {
        processingJobs[filename].status = "done";
      }
      console.log(`✅ Processed & Sorted: ${filename}. ${rowsToInsert.length} clean rows saved.`);
    } catch (error: any) {
      console.error("❌ Server-side processing failed:", error);
      if (processingJobs[filename]) {
        processingJobs[filename].status = "error";
        processingJobs[filename].error = error.message;
      }
    }
  }
  // --- 2. DATA RETRIEVAL ---
  app.get("/api/status/:filename", (req, res) => {
    const filename = decodeURIComponent(req.params.filename).trim();
    const job = processingJobs[filename];
    if (job) {
      return res.json(job);
    }
    return res.json({ status: "unknown", total: 0, done: 0 });
  });

  app.get("/api/data", async (req, res) => {
    try {
      // Check if variables are missing
      if (!process.env.R2_BUCKET_NAME) {
        throw new Error("R2_BUCKET_NAME is not defined in .env");
      }

      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
      });
      const { Contents } = await s3.send(command);
      const fileList = Contents?.map(obj => obj.Key) || [];
      res.json(fileList);
    } catch (error: any) {
      console.error("❌ ERROR IN /api/data:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/data/:filename", async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename).trim();

      let allData: any[] = [];
      let from = 0;
      let step = 999;

      while (true) {
        const { data, error } = await supabase
          .from("excel_rows")
          .select("data")
          .eq("filename", filename)
          .range(from, from + step);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        if (data.length <= step) break; // Finished fetching

        from += step + 1;
      }

      const rows = allData.map((row: any) => row.data).filter(Boolean);
      res.json(rows);
    } catch (error: any) {
      console.error("❌ ERROR IN /api/data/:filename GET:", error.message);
      res.status(500).json({ message: "Failed to load file data", details: error.message });
    }
  });

  app.delete("/api/data/:filename", async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename).trim();
      if (!filename) {
        return res.status(400).json({ message: "Filename is required." });
      }

      // 1) Delete source file from Cloudflare R2
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
      });
      await s3.send(deleteObjectCommand);

      // 2) Delete parsed rows from Supabase
      const { error } = await supabase.from("excel_rows").delete().eq("filename", filename);
      if (error) throw error;

      res.json({ success: true, filename });
    } catch (error: any) {
      console.error("❌ ERROR IN /api/data/:filename DELETE:", error.message);
      res.status(500).json({ message: "Failed to delete file", details: error.message });
    }
  });

  app.post("/api/data/:filename", async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename).trim();
      const payload = req.body;

      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return res.status(400).json({ message: "Invalid payload. Expected an object row." });
      }

      // Auto-categorize if "धारा" is supplied in the DataEntry form
      let dharaVal = undefined;
      for (const k of Object.keys(payload)) {
        if (k.trim() === "धारा" || k.includes("धारा")) {
          dharaVal = payload[k];
          break;
        }
      }
      if (dharaVal !== undefined && String(dharaVal).trim().length > 0) {
        const cleanText = normalizeDharaText(dharaVal);
        const { numbers, laws } = extractSectionsAndLaws(cleanText);
        for (const k of Object.keys(payload)) {
          const lower = k.toLowerCase().trim();
          if (lower === "law_hint" || lower === "crime_category" || lower === "section_numbers" || lower === "धारा_साफ") {
            delete payload[k];
          }
        }

        payload["धारा_साफ"] = cleanText;
        payload["section_numbers"] = Array.from(numbers).sort((a, b) => a - b).join(",");
        payload["law_hint"] = Array.from(laws).sort().join(",");
        payload["crime_category"] = detectCategory(numbers, laws);
      }

      const { error } = await supabase.from("excel_rows").insert({
        filename,
        data: payload,
        created_at: new Date(),
      });

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error("❌ ERROR IN /api/data/:filename POST:", error.message);
      res.status(500).json({ message: "Failed to save entry", details: error.message });
    }
  });

  // --- 3. VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => console.error("Startup Error:", err));
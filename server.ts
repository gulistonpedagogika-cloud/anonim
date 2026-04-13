import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Abstraction ---
let dbType: "mysql" | "sqlite" = "sqlite";
let mysqlPool: any = null;
let sqliteDb: any = null;
let dbError: string | null = null;

async function initDatabase() {
  let dbHost = (process.env.DB_HOST || "127.0.0.1").trim();
  let dbPort = 3306;
  dbError = null;

  if (dbHost.includes(":")) {
    const [host, port] = dbHost.split(":");
    dbHost = host;
    dbPort = parseInt(port) || 3306;
  }

  if (dbHost === "localhost") {
    dbHost = "127.0.0.1";
  }

  const useMysql = dbHost !== "127.0.0.1" || process.env.NODE_ENV === "production";

  if (useMysql) {
    try {
      console.log(`Attempting to connect to MySQL at ${dbHost}:${dbPort}...`);
      mysqlPool = mysql.createPool({
        host: dbHost,
        port: dbPort,
        user: process.env.DB_USER || "institut_anonimgspi",
        password: process.env.DB_PASS || "123321qweewqQ!",
        database: process.env.DB_NAME || "institut_anonim",
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 5000,
      });
      // Test connection
      const conn = await mysqlPool.getConnection();
      conn.release();
      dbType = "mysql";
      console.log("Connected to MySQL successfully.");

      // Create tables for MySQL if they don't exist
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS surveys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          code VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          survey_id INT NOT NULL,
          type VARCHAR(20) NOT NULL,
          text TEXT NOT NULL,
          sort_order INT DEFAULT 0,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS options (
          id INT AUTO_INCREMENT PRIMARY KEY,
          question_id INT NOT NULL,
          text TEXT NOT NULL,
          sort_order INT DEFAULT 0,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS responses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          survey_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      await mysqlPool.execute(`
        CREATE TABLE IF NOT EXISTS answers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          response_id INT NOT NULL,
          question_id INT NOT NULL,
          value TEXT NOT NULL,
          FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("MySQL tables verified/created.");
    } catch (err: any) {
      console.warn("MySQL connection failed, falling back to SQLite:", err.message);
      dbError = err.message;
      dbType = "sqlite";
    }
  }

  if (dbType === "sqlite") {
    console.log("Using SQLite database.");
    sqliteDb = new Database("surveys.db");
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        survey_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        response_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }
}

async function query(sql: string, params: any[] = []) {
  if (dbType === "mysql") {
    const [rows] = await mysqlPool.execute(sql.replace(/\?/g, "?"), params);
    return rows;
  } else {
    // Convert MySQL style queries to SQLite if needed (though they are mostly compatible here)
    const stmt = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return stmt.all(...params);
    } else {
      const result = stmt.run(...params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    }
  }
}

async function startServer() {
  await initDatabase();
  
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}...`);

  // Global request logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Health check
  app.get("/health", (req, res) => res.send("OK"));

  // --- API Routes ---

  app.get("/api/db-status", (req, res) => {
    console.log("API Hit: /api/db-status");
    res.json({ 
      type: dbType, 
      host: dbType === "mysql" ? (process.env.DB_HOST || "127.0.0.1") : "local (sqlite)",
      error: dbError
    });
  });

  app.get("/api/surveys/:code", async (req, res) => {
    const { code } = req.params;
    console.log(`Searching for survey with code: [${code}]`);
    try {
      // Case-insensitive search using LOWER()
      const surveys: any = await query(
        "SELECT * FROM surveys WHERE LOWER(code) = LOWER(?)",
        [code]
      );
      
      const survey = surveys[0];
      
      if (!survey) {
        console.log(`Survey with code [${code}] not found in database.`);
        return res.status(404).json({ error: "So'rovnoma topilmadi. Kodni to'g'ri kiritganingizni tekshiring." });
      }

      if (survey.status !== 'published') {
        console.log(`Survey [${code}] found but status is [${survey.status}].`);
        return res.status(404).json({ error: "Ushbu so'rovnoma hali chop etilmagan (Draft holatida)." });
      }

      const questions: any = await query(
        "SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order",
        [survey.id]
      );
      
      for (const q of questions) {
        if (q.type === 'single' || q.type === 'multiple') {
          const options: any = await query(
            "SELECT * FROM options WHERE question_id = ? ORDER BY sort_order",
            [q.id]
          );
          q.options = options;
        }
      }

      res.json({ ...survey, questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/surveys/:code/responses", async (req, res) => {
    const { code } = req.params;
    const { answers } = req.body;

    try {
      const surveys: any = await query(
        "SELECT id FROM surveys WHERE code = ? AND status = 'published'",
        [code]
      );
      const survey = surveys[0];
      if (!survey) throw new Error("Survey not found");

      const resInfo: any = await query(
        "INSERT INTO responses (survey_id) VALUES (?)",
        [survey.id]
      );
      const responseId = resInfo.insertId;

      for (const ans of answers) {
        await query(
          "INSERT INTO answers (response_id, question_id, value) VALUES (?, ?, ?)",
          [responseId, ans.question_id, JSON.stringify(ans.value)]
        );
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/surveys", async (req, res) => {
    try {
      const surveys = await query("SELECT * FROM surveys ORDER BY created_at DESC");
      res.json(surveys);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/surveys", async (req, res) => {
    const { title, description, code, questions } = req.body;
    
    try {
      const surveyInfo: any = await query(
        "INSERT INTO surveys (title, description, code) VALUES (?, ?, ?)",
        [title, description, code]
      );
      const surveyId = surveyInfo.insertId;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qInfo: any = await query(
          "INSERT INTO questions (survey_id, type, text, sort_order) VALUES (?, ?, ?, ?)",
          [surveyId, q.type, q.text, i]
        );
        const questionId = qInfo.insertId;

        if (q.options) {
          for (let j = 0; j < q.options.length; j++) {
            await query(
              "INSERT INTO options (question_id, text, sort_order) VALUES (?, ?, ?)",
              [questionId, q.options[j], j]
            );
          }
        }
      }

      res.json({ id: surveyId });
    } catch (err: any) {
      if (err.message.includes('UNIQUE') || err.message.includes('Duplicate')) {
        return res.status(400).json({ error: "Ushbu kod allaqachon mavjud." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/surveys/:id", async (req, res) => {
    try {
      await query("DELETE FROM surveys WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/surveys/:id/status", async (req, res) => {
    const { status } = req.body;
    try {
      await query("UPDATE surveys SET status = ? WHERE id = ?", [status, req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/surveys/:id/results", async (req, res) => {
    const surveyId = req.params.id;
    try {
      const surveys: any = await query("SELECT * FROM surveys WHERE id = ?", [surveyId]);
      const survey = surveys[0];
      if (!survey) return res.status(404).json({ error: "Survey not found" });

      const questions: any = await query(
        "SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order",
        [surveyId]
      );
      const respCount: any = await query(
        "SELECT COUNT(*) as count FROM responses WHERE survey_id = ?",
        [surveyId]
      );

      const results = [];
      for (const q of questions) {
        const answers: any = await query(
          "SELECT value FROM answers WHERE question_id = ?",
          [q.id]
        );
        const parsedAnswers = answers.map((a: any) => JSON.parse(a.value));

        let data: any = {};
        if (q.type === 'star') {
          const sum = parsedAnswers.reduce((acc: number, val: number) => acc + val, 0);
          data = { average: parsedAnswers.length ? (sum / parsedAnswers.length).toFixed(1) : 0, count: parsedAnswers.length };
        } else if (q.type === 'single' || q.type === 'multiple') {
          const options: any = await query(
            "SELECT * FROM options WHERE question_id = ? ORDER BY sort_order",
            [q.id]
          );
          const counts: Record<string, number> = {};
          options.forEach((opt: any) => counts[opt.text] = 0);
          
          parsedAnswers.forEach((val: any) => {
            if (Array.isArray(val)) {
              val.forEach(v => counts[v] = (counts[v] || 0) + 1);
            } else {
              counts[val] = (counts[val] || 0) + 1;
            }
          });
          data = { counts, options: options.map((o: any) => o.text) };
        }
        results.push({ ...q, results: data });
      }

      res.json({ survey, results, responseCount: respCount[0].count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Ichki server xatoligi yuz berdi.", details: err.message });
  });

  // Global error handler for the whole app
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Server Error:", err);
    res.status(500).send("Serverda kutilmagan xatolik yuz berdi.");
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

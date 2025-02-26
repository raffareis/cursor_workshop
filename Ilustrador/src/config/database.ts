import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, {recursive: true});
}

const dbPath = path.join(dbDir, 'ilustrador.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
    initDb();
  }
});

// Initialize database tables
function initDb() {
  db.serialize(() => {
    // Table for projects/sessions
    db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT DEFAULT 'Projeto sem título',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

    // Table for text segments
    db.run(`CREATE TABLE IF NOT EXISTS segments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            text TEXT NOT NULL,
            position INTEGER,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`);

    // Table for generated images
    db.run(`CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            segment_id INTEGER,
            prompt TEXT NOT NULL,
            image_url TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
        )`);

    // Table for style settings
    db.run(`CREATE TABLE IF NOT EXISTS styles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            style_name TEXT,
            style_description TEXT,
            ai_params TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`);

    console.log('Database tables initialized');
  });
}

export default db;

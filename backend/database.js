const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir banco de dados SQLite:", err.message);
    } else {
        console.log("📦 Conectado ao banco de dados interno (SQLite).");
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            savedVideos TEXT DEFAULT '[]',
            likedVideos TEXT DEFAULT '[]'
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS tiktok_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            tiktok_username TEXT,
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            video_id TEXT,
            video_url TEXT,
            cover_url TEXT,
            caption TEXT,
            post_time INTEGER,
            status TEXT DEFAULT 'PENDING',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
    }
});

module.exports = db;

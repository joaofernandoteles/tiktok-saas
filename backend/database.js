const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite
const USE_PG = !!process.env.DATABASE_URL;

let db;

if (USE_PG) {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const convertPlaceholders = (sql) => {
        let i = 0;
        return sql.replace(/\?/g, () => `$${++i}`);
    };

    const pgInit = async () => {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            "savedVideos" TEXT DEFAULT '[]',
            "likedVideos" TEXT DEFAULT '[]'
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS tiktok_accounts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            tiktok_username TEXT,
            access_token TEXT,
            refresh_token TEXT,
            expires_at BIGINT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS scheduled_posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            video_id TEXT,
            video_url TEXT,
            cover_url TEXT,
            caption TEXT,
            post_time BIGINT,
            status TEXT DEFAULT 'PENDING',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        console.log('📦 Conectado ao banco de dados PostgreSQL.');
    };

    pgInit().catch(err => console.error('Erro ao inicializar PostgreSQL:', err.message));

    db = {
        run: (sql, params, callback) => {
            const pgSql = convertPlaceholders(sql);
            pool.query(pgSql, params || [])
                .then(result => { if (callback) callback.call({ lastID: result.rows[0]?.id, changes: result.rowCount }, null); })
                .catch(err => { if (callback) callback(err); });
        },
        get: (sql, params, callback) => {
            const pgSql = convertPlaceholders(sql);
            pool.query(pgSql, params || [])
                .then(result => callback(null, result.rows[0]))
                .catch(err => callback(err));
        },
        all: (sql, params, callback) => {
            const pgSql = convertPlaceholders(sql);
            pool.query(pgSql, params || [])
                .then(result => callback(null, result.rows))
                .catch(err => callback(err));
        }
    };
} else {
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    const sqlite = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Erro ao abrir SQLite:', err.message);
        } else {
            console.log('📦 Conectado ao banco de dados interno (SQLite).');
            sqlite.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                savedVideos TEXT DEFAULT '[]',
                likedVideos TEXT DEFAULT '[]'
            )`);
            sqlite.run(`CREATE TABLE IF NOT EXISTS tiktok_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                tiktok_username TEXT,
                access_token TEXT,
                refresh_token TEXT,
                expires_at INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);
            sqlite.run(`CREATE TABLE IF NOT EXISTS scheduled_posts (
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
    db = sqlite;
}

module.exports = db;

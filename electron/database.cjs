const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

let db = null;

function initDatabase() {
    const dbDir = path.join(os.homedir(), '.claude');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'sessions.db');
    console.log('[Database] Initializing database at:', dbPath);

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS code_sessions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            workingDirectory TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            lastActiveAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cowork_folders (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            fileCount INTEGER DEFAULT 0,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            lastActiveAt TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_code_sessions_lastActiveAt ON code_sessions(lastActiveAt);
        CREATE INDEX IF NOT EXISTS idx_cowork_folders_lastActiveAt ON cowork_folders(lastActiveAt);
    `);

    console.log('[Database] Database initialized successfully');

    // Clean up old sessions (30 days)
    cleanupOldSessions();

    return db;
}

function getDatabase() {
    if (!db) {
        initDatabase();
    }
    return db;
}

function cleanupOldSessions() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
        const codeResult = db.prepare('DELETE FROM code_sessions WHERE lastActiveAt < ?').run(thirtyDaysAgo);
        const coworkResult = db.prepare('DELETE FROM cowork_folders WHERE lastActiveAt < ?').run(thirtyDaysAgo);

        if (codeResult.changes > 0 || coworkResult.changes > 0) {
            console.log(`[Database] Cleaned up ${codeResult.changes} code sessions and ${coworkResult.changes} cowork folders`);
        }
    } catch (err) {
        console.error('[Database] Failed to cleanup old sessions:', err);
    }
}

// Code Sessions
function saveCodeSession(session) {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO code_sessions (id, type, workingDirectory, status, createdAt, lastActiveAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        session.id,
        session.type,
        session.workingDirectory,
        session.status,
        session.createdAt,
        session.lastActiveAt
    );
}

function getCodeSession(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM code_sessions WHERE id = ?');
    return stmt.get(id);
}

function getAllCodeSessions() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM code_sessions ORDER BY lastActiveAt DESC');
    return stmt.all();
}

function deleteCodeSession(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM code_sessions WHERE id = ?');
    stmt.run(id);
}

function updateCodeSessionActivity(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE code_sessions SET lastActiveAt = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
}

// Cowork Folders
function saveCoworkFolder(folder) {
    const db = getDatabase();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO cowork_folders (id, path, fileCount, status, createdAt, lastActiveAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        folder.id,
        folder.path,
        folder.fileCount || 0,
        folder.status,
        folder.createdAt,
        folder.lastActiveAt
    );
}

function getCoworkFolder(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cowork_folders WHERE id = ?');
    return stmt.get(id);
}

function getAllCoworkFolders() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cowork_folders ORDER BY lastActiveAt DESC');
    return stmt.all();
}

function deleteCoworkFolder(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM cowork_folders WHERE id = ?');
    stmt.run(id);
}

function updateCoworkFolderActivity(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE cowork_folders SET lastActiveAt = ? WHERE id = ?');
    stmt.run(new Date().toISOString(), id);
}

function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Database closed');
    }
}

module.exports = {
    initDatabase,
    getDatabase,
    cleanupOldSessions,
    saveCodeSession,
    getCodeSession,
    getAllCodeSessions,
    deleteCodeSession,
    updateCodeSessionActivity,
    saveCoworkFolder,
    getCoworkFolder,
    getAllCoworkFolders,
    deleteCoworkFolder,
    updateCoworkFolderActivity,
    closeDatabase
};

import sqlite from 'sqlite3';

const db = new sqlite.Database('database.db', err => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

export const initializeDatabase = (): void => {
    console.log('Initializing database...');

    // processes table
    db.run(
        `CREATE TABLE IF NOT EXISTS processes (
        pid INTEGER PRIMARY KEY NOT NULL UNIQUE,
        name TEXT NOT NULL,
        arguments TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        err => {
            if (err) {
                console.error('Error creating processes table:', err.message);
            } else {
                console.log('Processes table is ready.');
            }
        },
    );
};

export default db;

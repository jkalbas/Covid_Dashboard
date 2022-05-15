"use strict";

const Database = require('better-sqlite3');
const db = new Database('./data/log/log.db');
const user_data = new Database('./data/log/user_data.db');
const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`);
const st = user_data.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='user_data';`);
let row = stmt.get();
let row2 = st.get();

// Check if table exists
if (row === undefined) {

    console.log('initializing logging database...');

    const sqlInit = `
        CREATE TABLE accesslog (
            remoteaddr TEXT,
            remoteuser TEXT,
            time INTEGER PRIMARY KEY,
            method TEXT,
            url TEXT,
            protocol TEXT,
            httpversion TEXT,
            status INTEGER,
            referer TEXT,
            useragent TEXT     
        );`

    db.exec(sqlInit);

    console.log('logging database has been initialized');

} else {
    console.log('logging database exists.')
}

if (row2 == undefined){
    const add_table = `CREATE TABLE user_data (
        actionid INTEGER PRIMARY KEY AUTOINCREMENT, 
        username VARCHAR NOT NULL,
        remoteaddr TEXT,
        remoteuser TEXT,
        time INTEGER,
        method TEXT,
        url TEXT,
        protocol TEXT,
        httpversion TEXT,
        status INTEGER,
        referer TEXT,
        useragent TEXT
    );`
    user_data.exec(add_table);
} else {
    console.log('User data database exists.')
}

module.exports = {db, user_data}
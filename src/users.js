"use strict";

const database = require('better-sqlite3')
const db = new database('./data/db/users.db')

function check_user(user, pass) {
    let stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='users';`)
    let row = stmt.get();

    if (row == undefined) {
        const create_table = `CREATE TABLE users (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR,
            password VARCHAR NOT NULL
        );`

        db.exec(create_table);
    }

    let sql = db.prepare(`SELECT * FROM users WHERE username='${user}' and password='${pass}';`).all()
    if (sql.length == 0) {
        return false;
    } else {
        return true;
    }
}

function add_user(user, pass) {
    let stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='users';`)
    let row = stmt.get();

    if (row == undefined) {
        const create_table = `CREATE TABLE users (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR,
            password VARCHAR NOT NULL
        );`

        db.exec(create_table);
    }
    let check_usr = db.prepare(`SELECT username FROM users WHERE username='${user}';`).all()
    if (check_usr.length > 0) {
        return false;
    } else {
        let add_user = db.prepare(`INSERT INTO users(username, password) VALUES(?,?);`).run(user, pass);
        return true;
    }
}

function delete_acc(user, pass) {
    let stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='users';`)
    let row = stmt.get();

    if (row == undefined) {
        const create_table = `CREATE TABLE users (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR,
            password VARCHAR NOT NULL
        );`

        db.exec(create_table);
    }

    let check_usr = db.prepare(`SELECT * FROM users WHERE username='${user}' and password='${pass}';`).all()
    console.log(check_usr)
    if (check_usr.length > 0 && check_usr != undefined) {
        let to_delete = db.prepare(`DELETE FROM users WHERE username='${user}' and password='${pass}';`).run()
        return true;
    } else {
        return false;
    }
}

module.exports = {check_user, add_user, delete_acc}
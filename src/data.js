const Database = require('better-sqlite3');
const db = new Database('./data/db/database.db');

function getData(tbl_name, cols=[], paras=[], order_column) {
    
    sql = "SELECT ";

    if(cols.length == 0) {
        sql = sql + "*";
    } else {
        sql = sql + cols.toString();
    }
    sql = sql + " FROM " + tbl_name;
    if(paras.length > 0) {
        sql = sql + " WHERE " + paras.toString();
    }

    sql += " ORDER BY " + order_column
    sql = sql + ";";
    ret = db.prepare(sql).all();
    return ret;
}

module.exports = {getData}
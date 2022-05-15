/*  
    All tables are located in 'a99-furud/data/db/database.db'

    To add a new table to the database, add the dataset's api under
        'apis', add the table's format in 'tables_format', and 
        specify which column label to use when checking for updates
        under 'update_column'. The functions in this script should 
        then work
*/


'use strict';

const Database = require('better-sqlite3');
const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const $ = require("jquery")(window);

const db = new Database('./data/db/database.db')

const apis = {
    'covid_deaths_by_sex': 'https://data.cdc.gov/resource/9bhg-hcku.json',
    'covid_deaths_over_time': 'https://data.cdc.gov/resource/9mfq-cb36.json',
    'covid_deaths_by_county': 'https://data.cdc.gov/resource/kn79-hsxy.json'
}

const tables_format = {
    'covid_deaths_by_sex': `
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_as_of DATETIME,
            start_date DATETIME,
            end_date DATETIME,
            "group" VARCHAR,
            year VARCHAR,
            month VARCHAR,
            state VARCHAR,
            sex VARCHAR,
            age_group VARCHAR,
            covid_19_deaths INTEGER,
            total_deaths INTEGER
        `,

    'covid_deaths_over_time': `
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_date DATETIME,
            state VARCHAR,
            tot_cases INTEGER,
            conf_cases INTEGER,
            prob_cases INTEGER,
            new_case INTEGER,
            pnew_case INTEGER,
            tot_death INTEGER,
            conf_death INTEGER,
            new_death INTEGER,
            created_at DATETIME
        `,

    'covid_deaths_by_county': `
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_as_of DATETIME,
            start_week DATETIME,
            end_week DATETIME,
            state_name VARCHAR,
            county_name VARCHAR,
            county_fips_code VARCHAR,
            urban_rural_code VARCHAR,
            covid_death INTEGER,
            total_death INTEGER
        `
}

const update_column = { // the column used to check if table has been updated
    'covid_deaths_by_sex': 'end_date',
    'covid_deaths_over_time': 'submission_date',
    'covid_deaths_by_county': 'end_week'
}

// Update database when program is launched
update_database()
console.log('All tables are up-to-date')

/*  
    Updates all tables in the database
*/

async function update_database() {
    for (const [key, value] of Object.entries(update_column)) {
        update_table(key)
    }
    return
}


/*  
    Creates table with the speecified name and populates it

    NOTE: this function overrides the table in the database
        if it already exists
*/

function create_table(tbl_name) {

    var format = tables_format[tbl_name]

    if (format == undefined) {
        console.log('table format not found, please create new entry in "populate_db.js"')
        return
    }

    let stmt = db.prepare(`
        SELECT name
        FROM sqlite_master 
        WHERE type='table' AND name='${tbl_name}';
    `)

    if (stmt.get() != undefined) { // table existS
        console.log(`Table already exists, overriding its contents...`)
        db.prepare(`DROP TABLE ${tbl_name};`).run()
    }

    console.log(`Creating new table '${tbl_name}'...`)

    stmt = db.prepare(`
       CREATE TABLE ${tbl_name} (
            ${format}
        );
    `)

    stmt.run()
    console.log(`Table has been created`)

    console.log('Fetching table contents...')

    $.ajax({ // fetches dataset from the CDC website
        url: apis[tbl_name],
        type: "GET",
        data: {
            "$limit": 100000,
            "$$app_token": "LkodRSqKWrJ9i691KYiUPv9oG"
        }
    }).done(function (data) {
        console.log("Retrieved " + data.length + " records from the dataset");
        write_to_table(tbl_name, data);

    }).fail(function (data) {
        console.error('Error: Unable to retrieve data set')
        console.error(data)
    })

    return
}


/*  
    Updates table with the speecified name and appends
        the new data onto it 

    NOTE: the specified table must already exist in the 
        database
*/

function update_table(tbl_name) {

    var format = tables_format[tbl_name]

    if (format == undefined) {
        console.error('Table format not found, please create new entry in "populate_db.js"')
        return
    }

    let stmt = db.prepare(`
        SELECT name
        FROM sqlite_master 
        WHERE type='table' AND name='${tbl_name}';
    `)

    if (stmt.get() == undefined) { // table doesn't exist
        console.log(`Table ${tbl_name} does not exist`)
        return create_table(tbl_name)
    }

    var format = tables_format[tbl_name]

    if (format == undefined) {
        console.log('table format not found, please create new entry in "populate_db.js"')
        return
    }

    stmt = db.prepare(`
        SELECT MAX(${update_column[tbl_name]}) AS latest
        FROM ${tbl_name};
    `).get()

    // console.log(`Updating table '${tbl_name}'...`)

    let latest_date = stmt['latest']

    // console.log(`Fetching rows with '${update_column[tbl_name]}' later than ${latest_date}`)

    $.ajax({ // fetches dataset from the CDC website
        url: `${apis[tbl_name]}?$where=${update_column[tbl_name]}>'${latest_date}'`,
        type: "GET",
        data: {
            "$limit": 100000,
            "$$app_token": "LkodRSqKWrJ9i691KYiUPv9oG"
        }

    }).done(function (data) {
        if (data.length == 0) {
            // console.log('No new data was found, table is already up to date')
            return
        }

        console.log("Retrieved " + data.length + " records for '" + tbl_name + "'");
        write_to_table(tbl_name, data);

    }).fail(function (data) {
        console.error("Unable to retrieve dataset for '" + tbl_name + "'")
        console.error(data)
    })


    return
}


/*  
    Appends the data to the table with the speecified name

    NOTE: external access to this function should be restricted
        to prevent duplicate entries
*/

function write_to_table(tbl_name, dataset) {

    console.log(`Adding data to table '${tbl_name}'...`)
    console.log('NOTE: This might take a few minutes')

    var deaths_format = tables_format[tbl_name].split(',')

    // get the table's column names 
    deaths_format.forEach((element, index) => {
        deaths_format[index] = element.slice(13, element.length).split(' ')[0]
    });
    deaths_format.splice(0, 1)

    var stmt = db.prepare(`
        INSERT INTO ${tbl_name} (
            ${deaths_format.join()}
        )
        VALUES (${'?,'.repeat(deaths_format.length).slice(0, -1)});
    `)

    // 'group' is a reserved keyword in Sqlite
    if (tbl_name == 'covid_deaths_by_sex') {
        deaths_format[3] = 'group'
    }

    // insert dataset into table row by row        
    for (var i = 0; i < dataset.length; i++) {

        var deaths_arr = []

        for (var j = 0; j < deaths_format.length; j++) {
            if (dataset[i].hasOwnProperty(deaths_format[j])) {
                deaths_arr.push(dataset[i][deaths_format[j]])
            } else {
                deaths_arr.push('')
            }
        }
        stmt.run(deaths_arr)
    }

    if (tbl_name == 'covid_deaths_by_county') {
        db.exec(`
            UPDATE covid_deaths_by_county
            SET covid_death=0
            WHERE covid_death='';
        `)
    } else if (tbl_name == 'covid_deaths_by_sex') {
        db.exec(`
            UPDATE covid_deaths_by_sex
            SET covid_19_deaths=0
            WHERE covid_19_deaths='';
        `)
    }

    console.log('Done. Table has been populated and is up to date.')
    return
}

module.exports = { create_table, update_table, update_database }
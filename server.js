const express = require("express");
const args = require("minimist")(process.argv.slice(0));
const app = express();
const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const $ = require("jquery")(window);
const users = require('./src/users.js')
const get_data = require("./src/data.js");
const fs = require('fs')
const morgan = require('morgan')
const logger = require('./src/middleware/logger.js')
const db = require("./src/populate_db.js");
const session = require('express-session')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("./frontend"));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// logging functions
app.use(logger)


let accesslogstream = fs.createWriteStream('./data/log/access.log', { flags: 'a' })
app.use(morgan('combined', { stream: accesslogstream }))

var port = args.port || 3000;

const server = app.listen(port, (req, res) => {
  console.log(`App listening on port ${port}`);
});

app.get("/update/:table", (req, res) => {
  if (req.params.table == "all") {
    res.status(200).send(db.update_database());
  } else {
    res.status(200).send(db.update_table(req.params.table));
  }
});

app.get('/logout', (req, res) => {
  if (req.session.loggedin) {
    req.session.loggedin = false;
    res.status(200).sendFile(__dirname + '/frontend/loggedout.html')
  }
  else {
    res.redirect('/')
  }
})

app.post("/get_data/", (req, res) => {
  res
    .status(200)
    .send(
      get_data.getData(
        req.body.name,
        (cols = req.body.cols),
        (paras = req.body.paras),
        req.body.order
      )
    );
});

app.get('/login', (req, res) => {
  res.status(200)
  if (req.session.loggedin) {
    res.redirect('/loggedin')
  } else {
    res.sendFile(__dirname + '/frontend/login.html')
  }
})

app.get('/loggedin', (req, res) => {
  try {
    res.sendFile(__dirname + '/frontend/loggedin.html')
  } catch (error) {
    console.log('error')
    console.error(error)
  }
  
})

app.post('/auth', (req, res) => {
  let username = req.body.username;
  let password = req.body.pass;

  check_pass = users.check_user(username, password);
  if (check_pass) {
    req.session.loggedin = true;
    req.session.username = username;
    res.redirect('/login')
  } else {
    console.log('invalid user')
    res.redirect('/login')
  }
  //res.end()
})

app.get('/signup', (req, res) => {
  res.status(200)
  res.sendFile(__dirname + "/frontend/signup.html")
})

app.post('/signup_conf', (req, res) => {
  let username = req.body.username;
  let password = req.body.pass;
  res.status(200);
  add = users.add_user(username, password);
  if (add) {
    console.log('User successfully added!')
    req.session.loggedin = true;
    req.session.username = username;
    res.redirect('/loggedin')
  } else {
    console.log('Username is already taken');
    res.redirect('/signup');
  }
})

app.get('/delete_acc', (req, res) => {
  res.status(200).sendFile(__dirname + '/frontend/delete_acc.html')
})

app.post('/delete_conf', (req, res) => {
  res.status(200)

  let username = req.body.username;
  let password = req.body.pass;
  deleted = users.delete_acc(username, password);
  if (deleted) {
    console.log('User successfully deleted!')
    req.session.loggedin = false;
    res.redirect('/')
    res.end()
  } else {
    console.log('Invalid login');
    res.redirect('/delete_acc');
    res.end()
  }
})


app.use(function (req, res) {
  res.status(404).send("404 Page Not Found");
});

const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const bodyParser = require('body-parser')
// routes includes
const webRoute = require("./routes/web");
const authRoutes = require('./routes/auth')

//const exphbs = require('express-handlebars')
//const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
//const MongoStore = require('connect-mongo')(session)
const connectDB = require('./config/db')
//Load config
dotenv.config({ path: './config/config.env' })

// Passport config
require('./config/passport')(passport)

connectDB()

const app = express()

// Body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())


// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  // view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// set up public folder
app.use(express.static(path.join(__dirname, "public")));
// Static Files
// dashboard 
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/images', express.static(__dirname + 'public/images'));

// routes

app.use("/", webRoute);
//app.use(authRoutes)

// 404 not found
app.use(function (req, res) {
    res.status(404).render('base/404');
});

// server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});

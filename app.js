require('dotenv').config();
const express            = require('express');
const path               = require('path');
const favicon            = require('serve-favicon');
const logger             = require('morgan');
const cookieParser       = require('cookie-parser');
const bodyParser         = require('body-parser');
const passport           = require('passport');
const LocalStrategy      = require('passport-local').Strategy;
const User               = require('./models/famille');
const bcrypt             = require('bcryptjs');
const session            = require('express-session');
const MongoStore         = require('connect-mongo')(session);
const mongoose           = require('mongoose');
const flash              = require('connect-flash');
const hbs                = require('hbs')




mongoose
  .connect('mongodb://localhost/espaceFamille', {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app = express();

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(session({
  secret: "projet2-les-trembles",
  store: new MongoStore( { mongooseConnection: mongoose.connection }),
  resave: true, // ou mettre FALSE??
  saveUninitialized: true,
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});
passport.deserializeUser((id, cb) => {
  User.findById(id)
    .then(user => cb(null, user))
    .catch(err => cb(err))
  ;
});

passport.use(new LocalStrategy(
  {passReqToCallback: true},
  (...args) => {
    const [req,,, done] = args;

    const {username, password} = req.body;

    User.findOne({username})
      .then(user => {
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
          
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: "Incorrect password" });
        }
    
        done(null, user);
      })
      .catch(err => done(err))
    ;
  }
))

const index = require('./routes/index');
app.use('/', index);

const authRoutes = require('./routes/authentication');


app.use('/', authRoutes);


// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;

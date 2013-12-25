var connect = require('connect'),
    express = require('express'),
    flash = require('connect-flash'),
    mongoose = require('mongoose'),
    models = require('./models'),
    http = require('http'),
    sio = require('socket.io'),
    app =  express(),
    io = sio.listen(app.listen(3000), { log: false }),
    cookieParser = express.cookieParser('topsecret'),
    sessionStore = new connect.middleware.session.MemoryStore(),
    SessionSockets = require('session.socket.io'),
    sessionSockets = new SessionSockets(io, sessionStore, cookieParser),
    db;

app.set('db-uri', 'mongodb://localhost/playlist');
app.set('view engine', 'jade');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cookieParser);
  app.use(express.session({ store: sessionStore }));
  app.use(flash());
  app.use('/js', express.static(__dirname + '/js'));
  app.use(express.static(__dirname + '/public'));
});

models.defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  app.Track = Track = mongoose.model('Track');
  db = mongoose.connect(app.set('db-uri'));
});

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  next();
}

app.get('/', checkAuth, function(req, res) {
  res.render('index', {
    title: 'Home',
    message: req.flash('info')
  });
});

app.get('/login', function(req, res) {
  res.render('login.jade', {
    locals: {
      title: 'Login',
      user: new User(),
      message: req.flash('error')
    }
  });
});

app.post('/login', function(req, res) {
  User.findOne({ name: req.body.user.name }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
      res.redirect('/');
    } else {
      req.flash('error', 'Incorrect credentials');
      res.redirect('/login');
    }
  });
});

app.get('/logout', function(req, res) {
  if (req.session) {
    req.session.destroy(function() {});
  }
  res.redirect('/login');
});

app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: {
      title: 'Sign Up',
      user: new User(),
      message: req.flash('error')
    }
  });
});

app.post('/users', function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('error', 'Account creation failed');
    res.redirect('/users');
  }

  user.save(function(err) {
    if (err) return userSaveFailed();
    req.flash('info', 'Your account has been created');
    req.session.user_id = user.id;
    res.redirect('/');
  });
});

sessionSockets.on('connection', function (err, socket, session) {
  if (!session) return;

  socket.on('add-track', function(track, next) {
    Track.findOne({ permalink_url:  track.permalink_url }, function(err, res) {
      if (!res) {
        track.users = [session.user_id]
        var newTrack = new Track(track);
        newTrack.save(function(err) {
          if (!err) next();
        });
      } else {
        User.findById(session.user_id, function(err, user){
          Track.update( { permalink_url:  track.permalink_url },
            { $addToSet: { users: user } },
            function(err) {
              if (!err) next();
            });
        });
      }
    });
  });

});

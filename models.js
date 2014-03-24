var crypto = require('crypto'),
    User;

function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
    * Model: User
    */
  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'name': { type: String, validate: [validatePresenceOf, 'name is required'], index: { unique: true } },
    'hashed_password': String,
    'salt': String
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  User.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  });
  
  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  User.method('getTracks', function(callback, limit) {
    Track.find({ users: { $in:[this._id]} }, function(err, res) {
      callback(res);
    });
  });

  User.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });

  Track = new Schema({
    'permalink_url': { type: String, index: { unique: true } },
    'title': String,
    'query': String,
    'users': [{ type: ObjectId, ref: 'User' }]
  });

  Track.method('appendUser', function(user_id) {
    this.users.push({ _id: user_id });
    this.save(function(err) {
      if (!err) next();
    });
  });

  mongoose.model('User', User);
  mongoose.model('Track', Track);

  fn();
}

exports.defineModels = defineModels;

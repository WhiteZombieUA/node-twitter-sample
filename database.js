// Require the nedb module
var Datastore = require('nedb'),
    fs = require('fs');

// Initialize two nedb databases. Notice the autoload parameter.
var users = new Datastore({ filename: __dirname + '/data/users', autoload: true }),
    comments = new Datastore({ filename: __dirname + '/data/comments', autoload: true });

// Create a "unique" index for the photo name and user ip
users.ensureIndex({fieldName: 'name', unique: false});
users.ensureIndex({email: 'name', unique: true});
comments.ensureIndex({fieldName: 'username', unique: false});

// Make the photos and users data sets available to the code
// that uses require() on this module:

module.exports = {
    users: users,
    comments: comments
};
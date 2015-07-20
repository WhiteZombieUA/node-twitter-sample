/**
 * This file defines the routes used in your application
 * It requires the database module that we wrote previously.
 */
var db = require('./database'),
    passport = require('passport'),
    users = db.users,
    comments = db.comments,
    async = require('async');

module.exports = function(app){

    // Homepage
    app.get('/', function(req, res){
        res.render('login');
    });

    app.post('/signup', function(req, res) {
        users.insert( {
            username: req.body.usernamesignup,
            regdate: new Date(),
            email: req.body.emailsignup,
            password: req.body.passwordsignup,
            posts: 0,
            i_follow: [],
            me_follow:[]
        });
        res.end('Registration was successful');
    });

    app.post('/login',
        passport.authenticate('local', { successRedirect: '/me',
            failureRedirect: '/',
            failureFlash: true })
    );

    app.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/me', function(req, res) {
        comments.find({username: req.user.username}, function(err, this_user_posts) {
            this_user_posts.sort(function (d1, d2) {
                return d2.date - d1.date;
            });

            res.render('me', {
                username: req.user.username,
                dbposts: req.user.posts,
                dbfollowers: req.user.me_follow.length,
                posts: this_user_posts
            });

        });
    });

    app.post('/subscribe', function(req, res){
        users.update({username: req.body.profile_username}, {$addToSet: {me_follow: req.body.current_username}}, function() {});
        users.update({username: req.body.current_username}, {$addToSet: {i_follow: req.body.profile_username}}, function() {});
        res.redirect('/@' + req.body.profile_username);
    });

    app.post('/unsubscribe', function(req, res){
        users.update({username: req.body.profile_username}, {$pull: {me_follow: req.body.current_username}}, function() {});
        users.update({username: req.body.current_username}, {$pull: {i_follow: req.body.profile_username}}, function() {});
        res.redirect('/@' + req.body.profile_username);
    });

    app.post('/search', function(req, res) {
        users.find({username: req.body.search_username}, function(err, user_profile) {
            next(err, user_profile[0] || null);
        });

        function next(err, user_profile) {
            if (user_profile == null) {
                res.end("User not found");
            } else {
                res.redirect('/@' + user_profile.username);
            }
        }
    });

    app.post('/post', function(req, res) {
        comments.insert({
                date: new Date(),
            username: req.body.uName,
            comment: req.body.uComment
        });
        users.update({username: req.user.username}, {$inc: { posts: 1 } }, {}, function (err, numReplaced) {});
        res.redirect(req.headers.referer);
    });

    app.get('/wall', function(req, res) {
        var render_posts = [req.user.username].concat(req.user.i_follow);
        comments.find({username: {$in: render_posts}}, function(err, user_posts) {
            user_posts.sort(function (d1, d2) {
                return d2.date - d1.date;
            });

            res.render('wall', {
                username: req.user.username,
                posts: user_posts
            });
        });
    });

    app.get('/@:id', function (req, res) {

        async.parallel({
            profile_user: function (next) {
                users.find({username: req.params.id}, function (err, users) {
                    next(err, users ? users[0] : null);
                })
            },

            this_user_posts: function(next) {
                comments.find({username: req.params.id}, function(err, this_user_posts) {
                    this_user_posts && this_user_posts.sort(function (d1, d2) {
                        return d2.date - d1.date;
                    });

                    next(err, this_user_posts);
                });
            }
        }, function(err, data) {

            var profile_user = data.profile_user,
                this_user_posts = data.this_user_posts,
                is_my_profile = req.user.username === req.params.id,
                is_follower = profile_user.me_follow.some(function (_) { return _ === req.user.username });

            res.render('profile', {
                username: req.user.username,
                profile_user: profile_user,
                dbposts: profile_user.posts,
                dbfollowers: profile_user.me_follow.length,
                posts: this_user_posts,
                me: is_my_profile,
                follow: is_follower
            });
        });
    })

};

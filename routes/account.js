
/*
    user_
         |registration|
         |login|
         |verification|
         |reset password|
*/
var express = require('express');
var router = express.Router();
var User = require('../models/user');
var id = require('shortid');
var passport = require('passport');
var passportConf = require("../config/passport");
var mailer = require('../misc/mailer');
var randomstring = require("randomstring");
var mongoose = require("mongoose");
var Club = require("../models/club")
var Market = require("../models/marketing")

// router.get('/register', function(req,res,next){
//     res.render("account/register")
// })
// router.post('/register', function(req,res,next){
//     var user = new User();
//     user.name = req.body.name;
//     user.college = req.body.college;
//     user.year = req.body.year;
//     user.phone = req.body.phone;
//     user.email = req.body.email;
//     user.password = req.body.password;
//     user.id = id.generate()
//     user.ca=req.body.ca;
//     User.findOne({ $or:[ {'email':req.body.email}, {'phone':req.body.phone}] }, function(_err, existingUser) {
//         if (existingUser) {
//             if(existingUser.email === req.body.email){
//                 req.flash("message", "email already exist")
//                 res.redirect('/login')
//                 } else {
//                 req.flash("message", "phone number already exist")
//                 res.redirect('/login')
//                 }
//         } else {
//           user.save(function(err, user) {
//             if (err) return next(err);      
//             req.logIn(user, function(err){
//                 if(err) return next(err);
//                 res.redirect('/profile')
//               })
//           });
//         }
//     });

// })
router.get('/login', function(req, res,next){
    res.render("account/login", {message: req.flash('message')})
})

router.post('/login',passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true,
}))

router.get('/reset', function(req, res,next){
    res.render("account/reset",{message: req.flash('message')})
})
router.post('/reset', function(req,res,next){
    User.findOne({email: req.body.email}, function(err, user){
        if(err) return next(err);
        if(user){
            user.resetPasswordToken = randomstring.generate();
            user.resetPasswordExpires = Date.now() + 3600000;
            user.save(function(err, user){
                if(err) return next(err);
                var html = 'hey user click this link to reset password  <a href="http://'+req.headers.host+'/reset/'+user.resetPasswordToken+'" target="_blank">href="http://'+req.headers.host+'/reset/'+user.resetPasswordToken+'"</a>'
                mailer.sendEmail("fmc@safe.com", user.email, 'Reset password', html)
                req.flash("message", "Email sent")
                res.redirect('/reset')
                })
        } else {
            req.flash("message", "No user avilable with this email")
            res.redirect('/reset')
        }
    })
})
router.get('/reset/:token', function(req,res,next){
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user){
        if(err) return next(err);
        if(user){
            res.render("account/resetpass", {email: user.email})
        }
    })
});

router.post('/reset/:token', function(req,res,next){
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user){
        if(err) return next(err);
        if(user){
            user.resetPasswordToken = undefined;
            user.resetPasswordToken = undefined;
            user.password = req.body.password;
            user.save(function(err, user){
                if(err) return next(err);
                req.logIn(user, function(err){
                    if(err) return next(err);
                    res.redirect('/profile')
                  })
            })
        }
    })
});

router.get('/profile',passportConf.isAuthenticated,async function(req,res,next){
    if(req.user.role == 'admin'){
        res.redirect('/dashboard')
    }
    if(req.user.role == 'user'){
    // res.render("panel/dashboard")
    res.send("have a nice day")
    }
    if(req.user.role == 'ca'){
        // function user(){
        //     return  User.find({ca: req.user.role}).exec()
        //   }
        //   var users = await user()
        //   // console.log(users)
        //   res.render("panel/dashboard", {users: users})
        res.send("Thanks for registration. Our Publicitty Team Contact you soon. You any trouble drop a mail to <a href='mailto:publifmcw.iitbhu@gmail.com?subject=Have%20touble%20in%20login'>publifmcw.iitbhu@gmail.com</a>")
    }
    if(req.user.role == 'marketing'){
        function market(){
            return Market.find({}).exec()
        }
        var markets = await market()
        res.render("panel/marketing", {markets: markets})

    }
    if(req.user.role !== 'user' && req.user.role !== 'admin' && req.user.role !== 'ca' && req.user.role !== 'marketing'){
        // console.log(req.user.role)
        function user(){
          return  User.find({"confirmevent.event": req.user.role}).populate("confirmevent.event").exec()
        }
        var users = await user()
        // console.log(users)
        res.render("panel/dashboard", {users: users})
    }

})

router.get("/logout", function(req, res , next){
    req.logOut();
    res.redirect("/");
  });


module.exports = router
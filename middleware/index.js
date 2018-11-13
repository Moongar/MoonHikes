var Trail = require("../models/trail");
var Comment = require("../models/comment");
var User = require("../models/user");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkTrailOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Trail.findById(req.params.id, function(err, foundTrail){
        if(err || !foundTrail){
            req.flash("error", "Trail not found");
            res.redirect("back");
        } else {
            if(foundTrail.author.id.equals(req.user._id)){
                next();
            }else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
        }
    });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err || !foundComment){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else {
            if(foundComment.author.id.equals(req.user._id)){
                next();
            }else {
                res.redirect("back");
            }
        }
    });
    } else {
        res.redirect("back");
    }
};

middlewareObj.checkUserOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
        if(err || !foundUser){
            req.flash("error", "User not found");
            res.redirect("back");
        } else {
            if(foundUser._id.equals(req.user._id)){
                next();
            }else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("/users/"+req.params.id);
            }
        }
    });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("/users/"+req.params.id);
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    req.session.returnTo = req.originalUrl;
    console.log(req.session.returnTo);
    res.redirect("/login");
};

module.exports = middlewareObj;
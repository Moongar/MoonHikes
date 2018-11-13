var express = require("express");
var router = express.Router({mergeParams:true});
var Trail  = require("../models/trail");
var Comment= require("../models/comment");
var middleware= require("../middleware");

//Comments new
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Trail.findById(req.params.id,function(err,trail){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {trail:trail});
        }
    });
});

//Comments create
router.post("/", middleware.isLoggedIn,function(req,res){
    Trail.findById( req.params.id, function(err, trail) {
        if(err){
            console.log(err);
            res.redirect("/trails");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    //add username and id to comment
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    //save comment
                    comment.save();
                    trail.comments.push(comment);
                    trail.save();
                    req.flash("success", "Successfully added comment");
                    res.redirect("/trails/"+trail._id);
                }
            });
        }
    });
});

//Edit comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Trail.findById(req.params.id, function(err, foundTrail) {
        if(err || !foundTrail){
            req.flash("error", "Trail not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if(err || !foundComment){
                res.redirect("back");
            } else {
                res.render("comments/edit", {trail_id: req.params.id, comment: foundComment});
            }
        });
    });
});

//Update comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err || !updatedComment){
            req.flash("error", "Comment not found");
            res.redirect("back");
        } else {
            res.redirect("/trails/"+req.params.id);
        }
    });
});

//Destroy comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/trails/"+req.params.id);
        }
    });
});

module.exports = router;
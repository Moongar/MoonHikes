var mongoose = require("mongoose");

var photoSchema= new mongoose.Schema({
    url: String,
    publicUrl: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatar: String
    },
    trail: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trail"
        },
        name: String,
    }
});

module.exports = mongoose.model("Photo", photoSchema);
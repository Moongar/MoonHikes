var     mongoose= require("mongoose");

//SCHEMA setup
var trailSchema= new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    length: String,
    elevation: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    photos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Photo"
        }
    ],
});

module.exports= mongoose.model("Trail", trailSchema);
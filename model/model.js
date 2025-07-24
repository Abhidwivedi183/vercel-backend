const mongoose = require("mongoose");
const schema = new mongoose.Schema({
tittle:{
    type:String,
    required:true,
},
body:{
    type:String,
    required:true,
},
user:[
    {
        type:mongoose.Types.ObjectId,
        ref:"User",

    }
],
});

const list = new mongoose.model("List",schema);
module.exports = list;
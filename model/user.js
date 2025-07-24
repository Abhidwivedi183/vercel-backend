const mongoose = require("mongoose");
const schema = new mongoose.Schema({
name:{
    type:String,
    required:true,
},
email:{
    type:String,
   
},
password:{
type:String,

},
list:[
    {
        type:mongoose.Types.ObjectId,
        ref:"List",

    }
],
});

const user = new mongoose.model("User",schema);
module.exports = user;
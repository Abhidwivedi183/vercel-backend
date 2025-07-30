const mong = require("mongoose");
<<<<<<< HEAD
mongoose.connect(process.env.MONGODB_URI)
=======
mong.connect("mongodb://localhost:27017/todoapp").then(()=>{console.log("connected")}).catch(()=>{"not connected"});
>>>>>>> 5d3261d (some changes)


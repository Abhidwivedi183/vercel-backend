<<<<<<< HEAD
// Vercel-compatible Todo App Express backend
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dotenv = require("dotenv");
const serverless = require("serverless-http");
const path = require("path");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// Models
const User = require("./model/user");
const List = require("./model/model");

// Routes
app.get("/", (req, res) => {
  res.send("Todo backend API running");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hash = bcrypt.hashSync(password, 11);
    const user = new User({ name, email, password: hash });
    await user.save();
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/registervalidate", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Sign up first" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: "Incorrect password" });

    const { password: _, ...data } = user._doc;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// Add task
app.post("/addtask", async (req, res) => {
  try {
    const { tittle, body, _id } = req.body;
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const task = new List({ tittle, body, user: user._id });
    await task.save();

    user.list.push(task._id);
    await user.save();

    res.status(200).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Task creation failed" });
  }
});

// Update task
app.put("/updatetask/:id", async (req, res) => {
  try {
    const { tittle, body } = req.body;
    await List.findByIdAndUpdate(req.params.id, { tittle, body });
    res.status(200).json({ message: "Task updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete task
app.delete("/deletetask/:id", async (req, res) => {
  try {
    await List.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// Get tasks by user ID
app.get("/gettask/:id", async (req, res) => {
  try {
    const tasks = await List.find({ user: req.params.id });
    res.status(200).json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

module.exports = app;
module.exports.handler = serverless(app);
=======
const express = require("express");
const app = express();
const list = require("./model/model");
const user = require("./model/user");
const dec = require("bcryptjs");
const cors = require("cors");
const port  = process.env.PORT || 3000;
const path = require("path");
app.use(cors({
    origin: 'http://localhost:5173',  // Allow only this origin
    methods: 'GET,POST,PUT,DELETE',  // Allow specific HTTP methods
    allowedHeaders: 'Content-Type,Authorization',  // Allow specific headers
}));
require("./db/conn");
app.use(express.json());

app.get("/",(req,res)=>{
    app.use(express.static(path.resolve(__dirname,"frontend","build")));
    res.sendFile(path.resolve(__dirname,"frontend","build","index.html"));
    res.send("hello son");
})


//signup
app.post("/register",async (req,res)=>{
    try {
     const {name,email,password} = req.body;//this not a function f***
     const hash = await dec.hashSync(password,11);
     const u = new user({name,email,password:hash});
     await u.save().then(()=>
         res.status(200).json({u:u})
     )
   
    } catch (error) {
        console.log(error);
     res.status(400).json({message:"already someone exists"});
    }
 })
 

 //signin
 app.post("/registervalidate",async (req,res)=>{
    try {

        const { email,password } = req.body;

        const u = await user.findOne({email:req.body.email});
        if(!u){
            res.send({message:"sign up first"});
        }
        const ispassword =await  dec.compare(password,u.password);
        if(!ispassword){
            res.status(400).json({message:"correct your password"});
        }
        const { password: _, ...others } = u._doc; // Exclude password from the response
        res.status(200).json(others); 
        // res.send({u});
        


    } 
    catch (error) {
        console.log(error);
    }
 })


 //adding task in list
 

 app.post("/addtask", async (req, res) => {
    try {
        const { tittle, body, _id } = req.body;
        const existingmail = await user.findById(_id);

        if (existingmail) {
            // Create new task
            const li = new list({ tittle, body, user: existingmail._id });
            
            // Save the task and send response after saving it
            await li.save();
            
            // After saving the task, update the user's list
            existingmail.list.push(li._id);
            await existingmail.save();

            // Send the response with the new task data
            return res.status(200).json(li);
        } else {
            // If the user does not exist, send an error message
            return res.status(200).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        // Send error response if something goes wrong
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});




//updating task in list
app.put("/updatetask/:id", async (req,res)=>{

   try {
    const {tittle,body} = req.body;
    
        await list.findByIdAndUpdate(req.params.id,{tittle,body});
        res.status(200).json({ message: "Task updated successfully" });

        //after updation no need to save the file

    
   } catch (error) {
    console.log(error);
   }

})



//delete
app.delete("/deletetask/:id",async (req,res)=>{
try {
    const taskId = req.params.id;
    const deletedTask = await list.findByIdAndDelete(taskId);
    res.status(200).json({message:"task is deleted"});
    
} catch (error) {
    console.log(error);
}
})




//get task
app.get("/gettask/:id",async (req,res)=>{
try {
    const li =await list.find({user:req.params.id});
res.status(200).json({li});
} catch (error) {
    console.log(error);
}

})

// { user: req.params.id } is the condition that is passed to find(). This 
// means you're looking for all tasks that have a user field that matches 
// the id passed in the URL.

app.listen(port,()=>{
    console.log("i am running");
})
>>>>>>> 5d3261d (some changes)

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

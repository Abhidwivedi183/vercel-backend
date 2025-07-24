// Vercel-compatible Express serverless backend
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const serverless = require("serverless-http");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection (use MongoDB Atlas)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// In-memory image upload placeholder (Vercel doesn't allow disk write)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("product"), (req, res) => {
  try {
    // Simulate image upload success (You can integrate Cloudinary here)
    res.json({ success: 1, image_url: "https://via.placeholder.com/150" });
  } catch (error) {
    res.status(500).json({ success: 0, error: error.message });
  }
});

const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ errors: "Please authenticate using a valid token" });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ errors: "Invalid token" });
  }
};

// Models
const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
});

// Routes
app.get("/", (req, res) => res.send("Backend API Root"));

app.post("/login", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.body.email });
    if (user && req.body.password === user.password) {
      const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.status(400).json({ success: false, errors: "Incorrect email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ success: false, errors: "User already exists" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;
    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();
    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/allproducts", async (req, res) => {
  try {
    const products = await Product.find({});
    res.send(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/newcollections", async (req, res) => {
  try {
    const products = await Product.find({});
    res.send(products.slice(1).slice(-8));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/popularinwomen", async (req, res) => {
  try {
    const products = await Product.find({});
    res.send(products.slice(0, 4));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/addtocart", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    user.cartData[req.body.itemId] += 1;
    await Users.findByIdAndUpdate(req.user.id, { cartData: user.cartData });
    res.send("Added");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/removefromcart", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (user.cartData[req.body.itemId] > 0) {
      user.cartData[req.body.itemId] -= 1;
    }
    await Users.findByIdAndUpdate(req.user.id, { cartData: user.cartData });
    res.send("Removed");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/getcart", fetchuser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    res.json(user.cartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/addproduct", async (req, res) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    const product = new Product({ id, ...req.body });
    await product.save();
    res.json({ success: true, name: req.body.name });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/removeproduct", async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = app;
module.exports.handler = serverless(app);

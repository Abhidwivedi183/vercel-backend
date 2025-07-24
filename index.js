const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Internal Server Error" });
};

// Database Connection With MongoDB
mongoose.connect("mongodb://localhost:27017/e-commerce")
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection error:", err));

// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single('product'), (req, res, next) => {
  try {
    res.json({ success: 1, image_url: `http://localhost:4000/images/${req.file.filename}` });
  } catch (error) {
    next(error);
  }
});

app.use('/images', express.static('upload/images'));

const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
};

const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true }
});

app.get("/", (req, res) => res.send("Root"));

app.post('/login', async (req, res, next) => {
  try {
    const user = await Users.findOne({ email: req.body.email });
    if (user && req.body.password === user.password) {
      const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.status(400).json({ success: false, errors: "Incorrect email or password" });
    }
  } catch (error) {
    next(error);
  }
});

app.post('/signup', async (req, res, next) => {
  try {
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ success: false, errors: "User already exists" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;
    const user = new Users({ name: req.body.username, email: req.body.email, password: req.body.password, cartData: cart });
    await user.save();
    const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    next(error);
  }
});

app.get("/allproducts", async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.send(products);
  } catch (error) {
    next(error);
  }
});

app.get("/newcollections", async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.send(products.slice(1).slice(-8));
  } catch (error) {
    next(error);
  }
});

app.get("/popularinwomen", async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.send(products.splice(0, 4));
  } catch (error) {
    next(error);
  }
});

app.post('/addtocart', fetchuser, async (req, res, next) => {
  try {
    const user = await Users.findById(req.user.id);
    user.cartData[req.body.itemId] += 1;
    await Users.findByIdAndUpdate(req.user.id, { cartData: user.cartData });
    res.send("Added");
  } catch (error) {
    next(error);
  }
});

app.post('/removefromcart', fetchuser, async (req, res, next) => {
  try {
    const user = await Users.findById(req.user.id);
    if (user.cartData[req.body.itemId] > 0) {
      user.cartData[req.body.itemId] -= 1;
    }
    await Users.findByIdAndUpdate(req.user.id, { cartData: user.cartData });
    res.send("Removed");
  } catch (error) {
    next(error);
  }
});

app.post('/getcart', fetchuser, async (req, res, next) => {
  try {
    const user = await Users.findById(req.user.id);
    res.json(user.cartData);
  } catch (error) {
    next(error);
  }
});

app.post("/addproduct", async (req, res, next) => {
  try {
    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;
    const product = new Product({ id, ...req.body });
    await product.save();
    res.json({ success: true, name: req.body.name });
  } catch (error) {
    next(error);
  }
});

app.post("/removeproduct", async (req, res, next) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(port, (error) => {
  if (!error) console.log("Server Running on port " + port);
  else console.log("Error : ", error);
});

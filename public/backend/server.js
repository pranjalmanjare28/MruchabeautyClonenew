const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(express.json());

app.use(cors());

// Serve frontend static files
app.use(express.static(path.join(__dirname, ".."))); 

// --- MongoDB connection ---
mongoose.connect("mongodb+srv://pranjal123:pranjal123@mrucha.qfhympu.mongodb.net/mruchaDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", userSchema);

const orderSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  country: String,
  state: String,
  city: String,
  pin: String,
  phone: String,
  cart: Array,
  total: Number,
  paymentMethod: String,
  paymentDetails: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// --- Signup route ---
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "Signup successful!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during signup", error });
  }
});

// --- Login route ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, "SECRET_KEY", { expiresIn: "1h" });

    res.json({ 
      message: "Login successful", 
      token, 
      userId: user._id, 
      name: user.name, 
      email: user.email 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during login", error });
  }
});

// --- Order route ---
app.post("/order", async (req, res) => {
  try {
    const orderData = req.body;

    // Validate minimal required fields
    if (!orderData.firstName || !orderData.email || !orderData.cart || orderData.cart.length === 0) {
      return res.status(400).json({ message: "Missing required order information" });
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to place order", error });
  }
});

// --- Catch-all route to serve frontend ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --- Start server ---
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cron = require("node-cron"); // ✅ Only declare this once!

 
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB
mongoose.connect("mongodb+srv://shashistudy2125:abc12345@cluster0.of0ap6g.mongodb.net/grocery_auth_app?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) return res.status(400).json({ message: "Username or email already exists." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();
  res.status(201).json({ message: "Registration successful!" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Invalid username or password" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

  res.json({ message: "Login successful" });
});

app.post("/place-order", async (req, res) => {
  try {
    const { username, address, items, totalAmount } = req.body;
    const newOrder = new Order({ username, address, items, totalAmount });
    await newOrder.save();

    const user = await User.findOne({ username });
    if (user && user.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "shashistudy2125@gmail.com",
          pass: "xweh opxh bcgi yhjr"
        }
      });

      const itemList = items.map(i => `<li>${i.name} - ${i.quantity}kg - ₹${i.quantity * i.price}</li>`).join('');
      const mailOptions = {
        from: "shashistudy2125@gmail.com",
        to: user.email,
        subject: "Your Grocery Order Confirmation",
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>Hi ${username},</h3>
            <p>Thanks for your order!</p>
            <p><strong>Address:</strong> ${address}</p>
            <ul>${itemList}</ul>
            <p><strong>Total:</strong> ₹${totalAmount}</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(201).json({ message: "Order placed and email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place order or send email." });
  }
});

// 🔁 CRON JOB — Runs every day at 8 AM
// 🔁 CRON JOB — Runs every 2 minutes (for testing)
cron.schedule("*/2 * * * *", async () => {
  console.log("⏰ Running 2-min test reminder check...");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const ordersToRemind = await Order.find({
      placedAt: {
        $gte: new Date(thirtyDaysAgo.setHours(0, 0, 0, 0)),
        $lte: new Date(thirtyDaysAgo.setHours(23, 59, 59, 999))
      }
    });

    for (const order of ordersToRemind) {
      const user = await User.findOne({ username: order.username });
      if (user && user.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "shashistudy2125@gmail.com",
            pass: "xweh opxh bcgi yhjr"
          }
        });

        const itemList = order.items.map(i => `<li>${i.name} - ${i.quantity}kg - ₹${i.quantity * i.price}</li>`).join("");
        const mailOptions = {
          from: "shashistudy2125@gmail.com",
          to: user.email,
          subject: "Order Again? Your Previous Grocery Order",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h3>Hello ${order.username},</h3>
              <p>It's been 30 days since your last order! Want to order the same items again?</p>
              <ul>${itemList}</ul>
              <p>Total: ₹${order.totalAmount}</p>
              <a href="http://localhost:5000/order-again?user=${user.username}" 
                 style="display:inline-block; padding:10px 20px; background-color:#28a745; color:white; text-decoration:none; border-radius:8px;">
                 Order Again
              </a>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Reminder sent to ${user.email}`);
      }
    }
  } catch (err) {
    console.error("❌ Error in cron job:", err);
  }
});

// Endpoint to show repeat order page
app.get('/order-again', async (req, res) => {
  const { user } = req.query;
  const lastOrder = await Order.findOne({ username: user }).sort({ placedAt: -1 });
  res.send(`
    <h2>Hi ${user}, here’s your last order:</h2>
    <ul>
      ${lastOrder.items.map(i => `<li>${i.name} - ${i.quantity}kg - ₹${i.quantity * i.price}</li>`).join('')}
    </ul>
    <form action="/place-order" method="post">
      <input type="hidden" name="username" value="${user}" />
      <input type="hidden" name="address" value="${lastOrder.address}" />
      <input type="hidden" name="items" value='${JSON.stringify(lastOrder.items)}' />
      <input type="hidden" name="totalAmount" value="${lastOrder.totalAmount}" />
      <button type="submit">Confirm Repeat Order</button>
    </form>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
// const cron = require("node-cron");

cron.schedule("*/1 * * * *", async () => {
  console.log("⏰ Running 1-minute reminder check...");

  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 5 * 60000); // 2 minutes ago

  try {
    const orders = await Order.find({
      placedAt: {
        $gte: new Date(twoMinutesAgo.setSeconds(0, 0)),
        $lte: new Date(now.setSeconds(59, 999))
      }
    });

    for (const order of orders) {
      const user = await User.findOne({ username: order.username });
      if (user && user.email) { 
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "shashistudy2125@gmail.com",
            pass: "xweh opxh bcgi yhjr"
          }
        });

        const mailOptions = {
          from: "shashistudy2125@gmail.com",
          to: user.email,
          subject: "🛒 It's Time to Buy Again!",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>Hello ${user.username},</h2>
              <p>It's time to buy again! Your last order was 1 minutes ago.</p>
              <p>Click below to repeat your order:</p>
              <a href="http://localhost:5000/order.html?user=${user.username}" 
                 style="padding:10px 20px; background-color:#007BFF; color:white; text-decoration:none; border-radius:6px;">
                 Order Again
              </a>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📩 Email sent to ${user.email}`);
      }
    }
  } catch (err) {
    console.error("❌ Error in cron job:", err);
  }
});

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  username: String,
  email: String,
  address: String,
  items: [{ name: String, quantity: Number, price: Number }],
  totalAmount: Number,
  placedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);

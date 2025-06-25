// server.js (Express backend)
const express = require("express");
const app = express();
const stripe = require("stripe")("sk_test_..."); // Your Stripe secret key
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Simulated user (replace with JWT/session logic in production)
const mockUser = {
  email: "test@jesusify.com",
  subscription: "worshipper"
};

app.get("/api/me", (req, res) => {
  res.json(mockUser);
});

app.post("/api/checkout", async (req, res) => {
  const { priceId } = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: "http://localhost:5500/subscription.html?status=success",
    cancel_url: "http://localhost:5500/subscription.html?status=cancel",
    customer_email: mockUser.email
  });

  res.json({ url: session.url });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

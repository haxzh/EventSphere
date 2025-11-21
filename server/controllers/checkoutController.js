const stripe = require("stripe")(process.env.STRIPE_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { price, name, eventId, user_token } = req.body;
    if (!price || !name) return res.status(400).json({ error: "Missing price or name" });

    const clientUrl = process.env.CLIENT_URL || `http://localhost:3000`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // pass some metadata so server can reconcile after success if needed
      metadata: {
        eventId: eventId || "",
        user_token: user_token || "",
      },
      // redirect back to client app (not API server)
      success_url: `${clientUrl}/users/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/event/${eventId || ""}`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("createCheckoutSession error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

module.exports = {
  createCheckoutSession,
};

const stripe = require("stripe")(process.env.STRIPE_KEY);
const { v4: uuidv4 } = require("uuid");
const User = require("../models/user");
const { Event } = require("../models/event");
const { sendTicket } = require("./smsController");

// core processing logic shared by webhook and direct processing
const processSessionObject = async (session) => {
  const metadata = session.metadata || {};
  const eventId = metadata.eventId || "";
  const user_token = metadata.user_token || metadata.userToken || "";

  const users = await User.find({ user_token: user_token }).exec();
  if (!users || users.length === 0) {
    console.warn("processSession: user not found for token", user_token);
    return { ok: false, reason: "user_not_found" };
  }
  const user = users[0];

  const pass = uuidv4();
  const Details = {
    email: session.customer_details?.email || user.email,
    event_name:
      session.display_items?.[0]?.custom?.name || session.metadata?.name || (session.line_items && session.line_items.data && session.line_items.data[0]?.description) || "",
    name: session.customer_details?.name || user.username || "",
    pass: pass,
    price: (session.amount_total || session.amount_subtotal || 0) / 100,
    address1: session.customer_details?.address?.line1 || "",
    city: session.customer_details?.address?.city || "",
    zip: session.customer_details?.address?.postal_code || "",
  };

  const found = await Event.findOne({ event_id: eventId }).exec();
  if (found) {
    const exists = found.participants && found.participants.find((p) => p.id === user.user_token);
    if (!exists) {
      found.participants.push({
        id: user.user_token,
        name: user.username || Details.name,
        email: user.email || Details.email,
        passID: pass,
        regno: user.reg_number || "",
        entry: false,
      });
      await found.save();
    }
  } else {
    console.warn("processSession: event not found", eventId);
  }

  if (found) {
    await User.updateOne({ user_token: user.user_token }, { $push: { registeredEvents: found } }).exec();
  }

  // send ticket
  sendTicket(Details);
  return { ok: true };
};

const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data ? event.data.object : event;
    try {
      await processSessionObject(session);
    } catch (err) {
      console.error("Error processing checkout.session.completed:", err);
      return res.status(500).send();
    }
  }

  res.json({ received: true });
};

// process session by retrieving it from Stripe (used when client returns with session_id)
const processSessionById = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "session_id required" });
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["line_items"] });
    const result = await processSessionObject(session);
    return res.json(result);
  } catch (err) {
    console.error("processSessionById error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
};

module.exports = { handleWebhook, processSessionById };

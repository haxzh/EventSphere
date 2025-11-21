const express = require("express");
const app = express();
const mongoose = require("mongoose");

const cors = require("cors");

const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const userRouter = require("./routes/authRoutes");
const dashboardRouter = require("./routes/userDashboardRoutes");
const paymentRouter = require("./routes/paymentRoute");
const checkoutRouter = require("./routes/checkoutRoute");
const adminRouter = require("./routes/adminRoutes");
const eventRouter = require("./routes/eventRoutes");
const uploadRouter = require("./routes/uploadRoute");
// const checkInRouter = require("./routes/checkInRoutes")

dotenv.config();
let mongoMemoryServer;
async function setupMongo() {
    let mongoUri = process.env.MONGO_ATLAS_URI;
    try {
        if (!mongoUri || mongoUri.trim() === "") {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            mongoMemoryServer = await MongoMemoryServer.create();
            mongoUri = mongoMemoryServer.getUri();
            console.log("Using in-memory MongoDB:", mongoUri);
            console.warn(
                "WARNING: Using in-memory MongoDB — data will NOT persist across server restarts.\nSet MONGO_ATLAS_URI in server/.env to a MongoDB Atlas or local URI to persist data. Example:\nMONGO_ATLAS_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mydb?retryWrites=true&w=majority"
            );
        }

        console.log("in index - ", mongoUri);
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection error:", err);
    }
}

// initialize mongo and then start app
setupMongo();

require("./models/otpAuth");
require("./models/user");
require("./models/admin");
require("./models/event");

// Stripe webhook needs raw body for signature verification. Register webhook
// route before the JSON body parser so we can use express.raw for it.
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
        // attach rawBody for compatibility with our webhook handler
        req.rawBody = req.body;
        next();
    },
    require("./controllers/webhookController").handleWebhook
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(cors());

const path = require("path");
// serve uploaded files statically from /uploads
app.use(
    "/uploads",
    express.static(path.join(__dirname, "public", "uploads"))
);

// upload route (POST /api/upload)
app.use("/api", uploadRouter);

app.use("/", paymentRouter);
app.use("/user", userRouter);
app.use("/user", dashboardRouter);
app.use("/", checkoutRouter);

app.use("/", adminRouter);
app.use("/", eventRouter);

app.get("/", (req, res) => {
    res.send("Event Management micro services API.");
});

const server = app.listen(process.env.PORT || 5000, () => {
    console.log(`Server Running on🚀: ${process.env.PORT || 5000}`);
});

process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    await mongoose.disconnect();
    if (mongoMemoryServer) await mongoMemoryServer.stop();
    server.close(() => process.exit(0));
});

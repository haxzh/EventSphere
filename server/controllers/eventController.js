const { Event } = require("../models/event");
const Admin = require("../models/admin");
const User = require("../models/user");
const dotenv = require("dotenv");
dotenv.config();

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const crypto = require("crypto");

const nodemailer = require("nodemailer");

function sendCheckInMail(data) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.NODE_MAILER_USER,
            pass: process.env.NODE_MAILER_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    let mailOptions = {
        from: process.env.NODE_MAILER_USER,
        to: data.email,
        subject: `${data.name} You've Checked In - InVITe`,
        html: `Dear ${data.name},<br><br>
           <strong>Congratulations, you've successfully checked in!</strong><br><br>
           Name: ${data.name}<br>
           Registration Number: ${data.regNo}<br>
           Contact Number: ${data.number}<br><br>
           If you have any questions or concerns, please don't hesitate to contact us:<br>
           Harsh Kumar: harshshakya908431@gmail.com<br>
           
           Thank you for choosing Event!<br><br>
           Best regards,<br>
           The Evente Team`,
    };

    transporter.sendMail(mailOptions, function (err, success) {
        if (err) {
            console.log(err);
        } else {
            console.log("Checked In Email sent successfully");
        }
    });
}

const postEvent = async (req, res) => {
    try {
        // Log incoming body for debugging
        console.log("POST /post/event body:", req.body);

        const Name = req.body.name;
        const Venue = req.body.venue;
        const Date = req.body.date;
        const Time = req.body.time;
        const Desc = req.body.description;
        const Price = req.body.price;
        const Profile = req.body.profile;
        const Cover = req.body.cover;
        const Organizer = req.body.organizer;

        const adminId = req.body.admin_id;
        console.log("Admin id:", adminId);

        const secret = JWT_SECRET;
        const payload = { email: Name };

        // If a JWT secret is provided, use JWT to create a token-based event_id.
        // Otherwise fall back to a random UUID so the endpoint still works locally
        // without a secret configured.
        let token;
        if (secret) {
            token = await jwt.sign(payload, secret);
        } else {
            token = crypto.randomUUID();
            console.warn(
                "JWT_SECRET not set — using UUID fallback for event_id:",
                token
            );
        }

        const new_event = new Event({
            event_id: token,
            name: Name,
            venue: Venue,
            date: Date,
            time: Time,
            description: Desc,
            price: Price,
            profile: Profile,
            cover: Cover,
            organizer: Organizer,
        });

        // Save and await result
        const saved = await new_event.save();
        console.log("Saved::New Event::created.", saved._id);

        // Update admin record if adminId provided
        if (adminId) {
            await Admin.updateOne(
                { admin_id: adminId },
                {
                    $push: {
                        eventCreated: {
                            event_id: token,
                            name: Name,
                            venue: Venue,
                            date: Date,
                            time: Time,
                            description: Desc,
                            price: Price,
                            profile:
                                Profile == null
                                    ? "https://i.etsystatic.com/15907303/r/il/c8acad/1940223106/il_794xN.1940223106_9tfg.jpg"
                                    : Profile,
                            cover:
                                Cover == null
                                    ? "https://eventplanning24x7.files.wordpress.com/2018/04/events.png"
                                    : Cover,
                            organizer: Organizer,
                        },
                    },
                }
            );
        }

        return res.status(200).send({ msg: "event created", event_id: token });
    } catch (err) {
        console.error("Error in postEvent:", err);
        return res.status(500).send({ msg: "error creating event", error: err.message });
    }
};

const allEvents = async (req, res) => {
    Event.find({})
        .then((data) => {
            res.status(200).send(data);
        })
        .catch((err) => {
            res.status(400).send({ msg: "Error fetching data", error: err });
        });
};

const particularEvent = async (req, res) => {
    const eventId = req.body.event_id;
    Event.find({ event_id: eventId })
        .then((data) => {
            res.status(200).send(data[0]);
        })
        .catch((err) => {
            res.status(400).send({ msg: "Error fetching event", error: err });
        });
};

const deleteEvent = async (req, res) => {
    const eventId = req.body.event_id;
    const adminId = req.body.admin_id;

    Event.deleteOne({ event_id: eventId }, function (err) {
        if (err) return handleError(err);
        else {
            console.log("Event deleted::events collection.");
        }
    });

    Admin.updateOne(
        { admin_id: adminId },
        { $pull: { eventCreated: { event_id: eventId } } },
        function (err) {
            if (err) return handleError(err);
            else {
                console.log("Event deleted::admin collection.");
            }
        }
    );
    res.status(200).send({ msg: "success" });
};

const checkin = async (req, res) => {
    const eventId = req.body.event_id;
    const userList = req.body.checkInList;

    let eventName = "";

    Event.find({ event_id: eventId })
        .then((data) => {
            eventName = data[0].name;
            console.log(eventName);
        })
        .catch((err) => {
            res.status(400).send({ msg: "Error fetching event", error: err });
        });

    for (let i = 0; i < userList.length; i++) {
        Event.updateOne(
            { event_id: eventId, "participants.id": userList[i] },
            { $set: { "participants.$.entry": true } },
            function (err) {
                if (err) return handleError(err);
                else {
                    console.log(`user :: checked-in`);
                }
            }
        );
    }

    for (let i = 0; i < userList.length; i++) {
        User.find({ user_token: userList[i] })
            .then((data) => {
                const data_obj = {
                    name: data[0].username,
                    regNo: data[0].reg_number,
                    email: data[0].email,
                    number: data[0].contactNumber,
                    event: eventName,
                };

                sendCheckInMail(data_obj);
            })
            .catch((err) => {
                // console.log({ msg: "Error fetching event", error: err });
            });
    }

    res.status(200).send({ msg: "success" });
};

module.exports = {
    postEvent,
    allEvents,
    particularEvent,
    deleteEvent,
    checkin,
};

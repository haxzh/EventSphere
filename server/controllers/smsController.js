const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

async function createEtherealTransporter() {
    // create a test account and return a transporter + preview url helper
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    return { transporter, account: testAccount };
}

function sendSMS(Email, otp) {
    // Always log the OTP locally for quick debugging
    console.log(`OTP for ${Email}: ${otp}`);

    const send = async () => {
        let transporter;
        let previewUrl = null;
        if (process.env.NODE_MAILER_USER && process.env.NODE_MAILER_PASS) {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.NODE_MAILER_USER,
                    pass: process.env.NODE_MAILER_PASS,
                },
                tls: { rejectUnauthorized: false },
            });
        } else {
            console.warn(
                `Mail credentials not set. Using Ethereal test account to simulate sending OTP to ${Email}.`
            );
            const eth = await createEtherealTransporter();
            transporter = eth.transporter;
        }

        const mailOptions = {
            from: process.env.NODE_MAILER_USER || 'no-reply@invite.test',
            to: Email,
            subject: 'One Time Password - Invite',
            html: `Please keep your OTP confidential and do not share it with anyone. The OTP will be valid for five minutes only. <br><strong>OTP: ${otp}</strong><br><br>Thank you for choosing Invite!<br><br>If you have any questions, please reply to this email or contact support at ${process.env.SUPPORT_EMAIL || process.env.NODE_MAILER_USER || 'support@example.com'}.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('OTP email sent:', info.messageId || info);
            // nodemailer.getTestMessageUrl returns preview url for Ethereal only
            previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log('Preview URL:', previewUrl);
        } catch (err) {
            console.log('Error sending OTP email:', err);
        }
    };

    // fire and forget
    send();
}

function sendTicket(Details) {
    console.log(`Sending ticket email to ${Details.email}. Pass: ${Details.pass}`);
    const send = async () => {
        let transporter;
        if (process.env.NODE_MAILER_USER && process.env.NODE_MAILER_PASS) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.NODE_MAILER_USER, pass: process.env.NODE_MAILER_PASS },
                tls: { rejectUnauthorized: false },
            });
        } else {
            console.warn('Mail credentials not set. Using Ethereal test account for ticket email.');
            const eth = await createEtherealTransporter();
            transporter = eth.transporter;
        }

        const mailOptions = {
            from: process.env.NODE_MAILER_USER || 'no-reply@invite.test',
            to: Details.email,
            subject: `Your Online Event Pass for ${Details.event_name} - InVITe✨`,
            html: `Dear <i>${Details.name}</i>,<br><br>Thank you for registering for ${Details.event_name}!<br><br><strong>Pass Number: ${Details.pass}</strong><br><br>Amount Paid: ${Details.price}<br>Address: ${Details.address1} <br> City: ${Details.city} <br> PinCode: ${Details.zip}<br><br>Best regards,<br>The event organizer Team`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Ticket email sent:', info.messageId || info);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log('Preview URL:', previewUrl);
        } catch (err) {
            console.log('Error sending ticket email:', err);
        }
    };
    send();
}

function sendWelcome(email, name) {
    console.log(`Sending welcome email to ${email}`);
    const send = async () => {
        let transporter;
        if (process.env.NODE_MAILER_USER && process.env.NODE_MAILER_PASS) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.NODE_MAILER_USER, pass: process.env.NODE_MAILER_PASS },
                tls: { rejectUnauthorized: false },
            });
        } else {
            console.warn('Mail credentials not set. Using Ethereal test account for welcome email.');
            const eth = await createEtherealTransporter();
            transporter = eth.transporter;
        }

        const mailOptions = {
            from: process.env.NODE_MAILER_USER || 'no-reply@invite.test',
            to: email,
            subject: `Welcome to InVITe, ${name}`,
            html: `Dear <strong>${name}</strong>,<br><br>Welcome to InVITe! Your account has been created successfully.<br><br>If you need help, reply to this email or contact support at ${process.env.SUPPORT_EMAIL || process.env.NODE_MAILER_USER || 'support@example.com'}.<br><br>Best regards,<br>The InVITe Team`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Welcome email sent:', info.messageId || info);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log('Preview URL:', previewUrl);
        } catch (err) {
            console.log('Error sending welcome email:', err);
        }
    };
    send();
}

module.exports = {
    sendSMS,
    sendTicket,
    sendWelcome,
};

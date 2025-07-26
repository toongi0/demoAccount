var express = require('express');
var router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AccountModel = require('../models/account.model');
const authToken = require('../middleware/authToken');

router.post('/register', async (req, res) => {
    const { email, password, phone } = req.body;
    try {
        // check if email exists
        let account = await AccountModel.findOne({ email });
        if (account) {
            return res.status(400).send("Email is used.");
        }

        // handle for new account
        const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // save account to db
        account = new AccountModel({
            email,
            password,
            phone,
            role: 'user',
            verify_token: verifyToken,
            active: false
        })
        await account.save();

        // send activation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const activationLink = `${process.env.CLIENT_URL}/register/verify/${verifyToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Activation Account',
            html: `
            <h3>Activation account</h3>
            <p>Please click the link below to activation account</p>
            <a href="${activationLink}">Activation</a>
            `
        });
        res.status(200).send("Register successfully! Please check your email to activation account.");

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

router.get("/verify/:token", async (req, res) => {
    const { token } = req.params;


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await AccountModel.findOne({ email: decoded.email });
        if (!account) {
            return res.status(400).send("Invalid token");
        }

        if (account.active) {
            return res.status(400).send("Account already activated");
        }

        account.active = true;
        account.verify_token = null;
        await account.save();

        return res.status(200).send("Account activated successfully");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Server Error");
    }
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const account = await AccountModel.findOne({ email });
        if (!account) {
            return res.status(400).send("email or password is incorrect");
        }

        if (!account.active) {
            return res.status(400).send("Account is not activated, please check your email to activation account");
        }


        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(400).send("email or password is incorrect");
        }

        // login success. generate jwt token
        const token = jwt.sign({ id: account._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).json({
            message: "Login successfully",
            token
        })
    } catch (err) {
        console.log(err);
        return res.status(500).send("Server Error");
    }
})

router.get('/findLoginUser', authToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await AccountModel.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "Account retrieved successfully", user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
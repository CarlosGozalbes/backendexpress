import express from "express";
import axios from "axios";

const newsletterRouter = express.Router();

newsletterRouter.post("/", async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please add an email address." });
        }
        const base64Key = Buffer.from(`anystring:`+proccess.env.MAILCHIMP_API_KEY).toString(
            "base64"
        );
        await axios.post(
            `https://${proccess.env.MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${proccess.env.MAILCHIMP_LIST}/members`,
            { email_address: email, status: "subscribed" }, // Make sure to enclose "subscribed" in quotes
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${base64Key}`,
                },
            }
        );
        return res
            .status(200)
            .json({ message: "You have been added to our newsletter successfully." });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default newsletterRouter;

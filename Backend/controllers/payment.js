const { Router } = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Joi = require('joi');

const paymentRouter = Router();

// Create Payment Intent
paymentRouter.post("/create-intent", async (req, res) => {
    try {
        const { amount, currency = "usd" } = req.body;

        const schema = Joi.object({
            amount: Joi.number().required(),
            currency: Joi.string()
        });

        const { error } = schema.validate({ amount, currency });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Stripe expects amount in cents
            currency: currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = paymentRouter;

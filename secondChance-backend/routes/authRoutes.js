const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');


router.post('/register', async (req, res) => {
    try {
        //connect to secondChance database through conncetToDatabase
        const db = await connectToDatabase();
        //access MongoDb users collection
        const collection = db.collection("users");
        //verify if user credentials already exist in the databases
        //const { user } = req.body

        const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('user already exists')
            return res.status(400).json({ error: 'user already exists!' });
        }
        //hash to encrypt password so that it is unreadable in the database
        const salt = await bcryptjs.genSalt(10); //length of the encrypted password
        const hashPassword = await bcryptjs.hashPassword(req.body.password, salt);
        //insert the user into the database
        const user = await collection.insertOne(
            {
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                password: hashPassword,
                createdAt: new Date(),
            }
        )
        //JWT authentication
        const payload = {
            user: {
                id: user.insertId,
            }
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        //Log the successful registration using the logger
        logger.info('User registered successfully');
        //Return the user email and token as JSON
        res.json({ authtoken, email });
    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});
module.exports = router;




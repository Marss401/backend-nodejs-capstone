const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
dotenv.config();

// {Insert it along with other imports} Task 1: Use the `body`,`validationResult` from `express-validator` for input validation
const { validationResult} = require('express-validator');

const logger = pino();  // Create a Pino logger instance


//Create JWT secret
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        //connect to secondChance database through conncetToDatabase
        const db = await connectToDatabase();
        //access MongoDb users collection
        const collection = db.collection("users");
        //verify if user credentials already exist in the databases

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
router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
         const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
         const collection = db.collection("users");
        // Task 3: Check for user credentials in database
         const authenticatedUser = await collection.findOne({ email: req.body.email });
        // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
        if(authenticatedUser){
            let result = await bcryptjs.compare(req.body.password, authenticatedUser.hashPassword);
            if(!result){
                logger.error('password does not match')
                return res.status(404).json('password does not match')
            }
            // Task 5: Fetch user details from a database
            const userName = authenticatedUser.firstName;
            const userEmail = authenticatedUser.email;

            // Task 6: Create JWT authentication if passwords match with user._id as payload
            let payload = {
                user: {
                    id: authenticatedUser._id.toString(),
                },
            };
            //Create JWT authentication if passwords match
            const authtoken = jwt.sign(payload, JWT_SECRET)
            logger.info('User logged in successfully');
            return res.status(200).json({authtoken, userName, userEmail });
        }
        else {
                // Task 7: Send appropriate message if the user is not found
                logger.error('User not found');
                return res.status(404).json({ error: 'User not found' });
            }
        }
    catch (e) {
        logger.error(e);
         return res.status(500).send('Internal server error');

    }
});
//Update API
router.put('/update', async (req, res) => {
        // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            logger.error('Validation errors in update request', errors.array())
            return res.status(400).json({errors: errors.array()})
        }
    try {
        // Task 3: Check if `email` is present in the header and throw an appropriate error message if it is not present
        const email = req.headers.email;
        if(!email){
            logger.error('Email not found in the request headers');
            return res.status(400).json({error: "Email not found in the request headers"});
        }
        // Task 4: Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection("users");

        // Task 5: Find the user credentials in database
       const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        existingUser.firstName = req.body.firstName;
        existingUser.updatedAt = new Date();

        // Task 6: Update the user credentials in the database
       const updatedUser = await collection.findOneAndUpdate(
    { email },
    { $set: existingUser },
    { returnDocument: 'after' }
);
        // Task 7: Create JWT authentication with `user._id` as a payload using the secret key from the .env file
        const payload = {
        user: {
                id: updatedUser._id.toString(),
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User updated successfully');
        res.json({
            message: "User updated successfully",
            user: updatedUser.value,
            authtoken
          });
    } catch (e) {
         return res.status(500).send('Internal server error');
    }
});
module.exports = router;




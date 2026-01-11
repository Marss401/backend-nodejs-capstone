// secondChnaceitems
const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')
console.log('Loaded: secondChanceItemsRoutes.js')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Step 2: task 1 - insert code here
    const db = await connectToDatabase()
    // Step 2: task 2 - insert code here
    const collection = db.collection('secondChanceItems')
    // Step 2: task 3 - insert code here
    const secondChanceItems = await collection.find({}).toArray()
    // Step 2: task 4 - insert code here
    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - insert code here
    const db = await connectToDatabase()
    // Step 3: task 2 - insert code here
    const collection = db.collection('secondChanceItems')
    // Step 3: task 3 - insert code here
    let secondChanceItem = req.body
    // Step 3: task 4 - insert code here
    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1)

    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id + 1).toString())
    })
    // Step 3: task 5 - insert code here
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.dateAdded = dateAdded
    // Step 3: Task 6 - insert code here
    secondChanceItem = await collection.insertOne(secondChanceItem)
    res.status(201).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    console.log('PARAM ID:', req.params.id)

    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItem = await collection.findOne({ id: String(id) })
    console.log(secondChanceItem)

    if (!secondChanceItem) {
      return res.status(404).send('This item was not found')
    }
    return res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    // Step 5: task 1 - insert code here
    const db = await connectToDatabase()
    // Step 5: task 2 - insert code here
    const collection = await db.collection('secondChanceItems')

    // Step 5: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json('secondChanceItem not found')
    }
    // Step 5: task 4 - insert code here
    secondChanceItem.category = req.body.category
    secondChanceItem.condition = req.body.condition
    secondChanceItem.age_days = req.body.age_days
    secondChanceItem.description = req.body.description
    secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1))
    secondChanceItem.updatedAt = new Date()

    const updateItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: 'after' }
    )

    // Step 5: task 5 - insert code here
    if (updateItem) {
      return res.json({ uploaded: 'success' })
    }
    return res.json({ uploaded: 'failed' })
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    // Step 6: task 1 - insert code here
    const db = await connectToDatabase()
    // Step 6: task 2 - insert code here
    const collection = await db.collection('secondChanceItems')
    // Step 6: task 3 - insert code here
    const id = req.params.id
    const secondChanceItem = await collection.findOne({ id })
    if (!secondChanceItem) {
      logger.error('secondChanceItems not found')
      res.status(404).json('secondChanceItems not found')
    }
    // Step 6: task 4 - insert code here
    await collection.deleteOne({ id })
    return res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router

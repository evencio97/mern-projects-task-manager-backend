const express = require('express');
const connectDB = require('./config/database');
require('dotenv').config({ path: '.env' });

// Init server
const app = express();
const PORT = process.env.PORT;

// Connect to DB
connectDB();

// Express.json
app.use(express.json({ extended: true }))

// Import Routes
app.use('/api/v1', require('./routes/routes'));

// Starting server
app.listen(PORT, () => {console.log('Server active')});
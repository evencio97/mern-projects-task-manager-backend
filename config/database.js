const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, 
            { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
        console.log('DB connected');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = connectDB;
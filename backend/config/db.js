//database connection 
const mongoose = require('mongoose')
const colors = require('colors')

//connectDB Function
const connectDB = async() => {
    try {
        //connection with MONGO_URL
        await mongoose.connect(process.env.MONGO_URL)
        console.log(`Mongodb connected ${mongoose.connection.host}`.bgGreen.white);
        
    } catch (error) {
        console.log(`Mongodb server Issue ${error}`.bgRed.white);
        
    }
}

//exporting connectDB
module.exports = connectDB;

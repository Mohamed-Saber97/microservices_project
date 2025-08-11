const mongoose = require("mongoose");
const logger = require('../utils/logger');
const connectDB = async ()=> {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        //console.log('Connected Succefully to database');
        logger.info('Connected Succefully to database');
    } catch (error) {
        //console.log(`error occour when connecting with database : ${error}`);
        logger.error('error occour when connecting with database', error);
        process.exit(1);
    }
}
module.exports = connectDB;
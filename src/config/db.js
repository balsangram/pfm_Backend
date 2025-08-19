// src/config/db.js
import mongoose from 'mongoose';
import { MONGODB_DB_NAME, MONGODB_URI } from './config.dotenv.js';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`MongoDB Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // exit process with failure
    }
};
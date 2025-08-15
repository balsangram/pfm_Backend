import dotenv from 'dotenv';
import { connectDB } from './src/cinfig/db.js';
import { PORT } from './src/cinfig/config.dotenv.js';
import { app } from './app.js';

// dotenv.config();

// Async server start
async function server() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('MongoDB connected successfully');

        // Start server
        const port = PORT || 8000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // exit process if connection fails
    }
}

server();

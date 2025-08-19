import { connectDB } from './src/config/db.js';
import { PORT } from './src/config/config.dotenv.js';
import { app } from './app.js';
import allSeeders from './seeders/index.js';
import chalk from 'chalk';


// Async server start
async function server() {
    try {

        // Connect to MongoDB
        await connectDB();
        console.log(chalk.green('MongoDB connected successfully'));

        // Seed the database
        await allSeeders();

        // Start server
        const port = PORT || 8000;
        app.listen(port, () => {
            console.log(chalk.green(`Server running on port ${port}`));
        });
    } catch (error) {
        console.error(chalk.red('Failed to connect to MongoDB:', error));
        process.exit(1); // exit process if connection fails
    }
}

server();

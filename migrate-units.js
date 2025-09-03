import mongoose from 'mongoose';
import SubCategory from './src/models/catalog/subCategorySchema.model.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Migration script to add default unit values
const migrateUnits = async () => {
    try {
        console.log('Starting unit migration...');
        
        // Find all subcategories without unit field or with empty unit
        const subcategories = await SubCategory.find({
            $or: [
                { unit: { $exists: false } },
                { unit: null },
                { unit: '' }
            ]
        });

        console.log(`Found ${subcategories.length} subcategories without unit field`);

        // Update each subcategory with default unit based on existing data
        for (const subcategory of subcategories) {
            let defaultUnit = 'kg'; // Default unit
            
            // Try to determine unit from existing data
            if (subcategory.pieces && subcategory.pieces !== '0' && subcategory.pieces !== '') {
                defaultUnit = 'pieces';
            } else if (subcategory.weight && subcategory.weight !== '0' && subcategory.weight !== '') {
                // Check if weight contains specific units
                const weightStr = subcategory.weight.toString().toLowerCase();
                if (weightStr.includes('liter') || weightStr.includes('l')) {
                    defaultUnit = 'liters';
                } else if (weightStr.includes('gram') || weightStr.includes('g')) {
                    defaultUnit = 'grams';
                } else {
                    defaultUnit = 'kg';
                }
            }

            // Update the subcategory
            await SubCategory.findByIdAndUpdate(subcategory._id, { unit: defaultUnit });
            console.log(`Updated ${subcategory.name} with unit: ${defaultUnit}`);
        }

        console.log('Unit migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run migration
connectDB().then(() => {
    migrateUnits();
});

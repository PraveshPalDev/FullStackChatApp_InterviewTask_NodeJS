import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/liveboard');
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');

        // List indexes to confirm
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        const usernameIndexInfo = indexes.find((idx: any) => idx.name === 'username_1');

        if (usernameIndexInfo) {
            console.log('Found username_1 index. Dropping it...');
            await collection.dropIndex('username_1');
            console.log('Successfully dropped username_1 index.');
        } else {
            console.log('username_1 index not found.');
        }

        // Also ensure email index is correct
        await User.syncIndexes();
        console.log('Synced indexes for User model.');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
};

fixIndexes();

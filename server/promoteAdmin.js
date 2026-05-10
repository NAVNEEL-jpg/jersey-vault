import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.log("\n❌ Please provide an email address.");
  console.log("Usage: node promoteAdmin.js your-email@example.com\n");
  process.exit(1);
}

const promote = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    // UPSERT: This will create the user if they don't exist
    // We use a placeholder firebaseUid if we are creating a new one
    const user = await User.findOneAndUpdate(
      { email: emailToPromote.toLowerCase() },
      { 
        role: 'admin',
        $setOnInsert: { 
          firebaseUid: `TEMP_ADMIN_${Date.now()}`,
          name: emailToPromote.split('@')[0], 
        } 
      },
      { upsert: true, new: true }
    );
    
    console.log(`\n✅ SUCCESS: Account "${emailToPromote}" is now an ADMIN in MongoDB.`);
    console.log("------------------------------------------------------------------");
    console.log("1. Go to your website.");
    console.log("2. Log in with this email.");
    console.log("3. The 'Auto-Sync' will automatically update your real ID from Firebase.");
    console.log("4. Navigate to /admin and you're in!\n");
    
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
    process.exit(1);
  }
};

promote();

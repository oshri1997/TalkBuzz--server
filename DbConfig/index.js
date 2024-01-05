import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    if (mongoose.connection.readyState === 1) {
      //1 === connected
      console.log("Database connected successfully");
    } else {
      console.log("Error connecting to database");
    }
  } catch (error) {
    console.error("Error connecting to database", error);
  }
};

export default dbConnection;

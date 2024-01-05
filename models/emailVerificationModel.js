import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
  userId: String,
  token: String,
  createdAt: Date,
  expiresAt: Date,
});

const Verification = mongoose.model("verfication", emailVerificationSchema);
export default Verification;

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashedValue = async (userValue) => {
  const salt = await bcrypt.genSalt(10);
  const hashedValue = await bcrypt.hash(userValue, salt);
  return hashedValue;
};

export const compareValues = async (userValue, hashedValue) => {
  const comparedValue = await bcrypt.compare(userValue, hashedValue);
  return comparedValue;
};

export const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
};

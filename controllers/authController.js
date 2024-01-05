import Users from "../models/userModel.js";
import { compareValues, generateToken, hashedValue } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    next("Provide Required Fields!");
    return;
  }
  try {
    const userExist = await Users.findOne({ email });
    if (userExist) {
      next("Email already exist!");
      return;
    }
    const hashedPassword = await hashedValue(password);
    const newUser = await Users.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    sendVerificationEmail(newUser, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      next("Provide Required Fields!");
      return;
    }

    const user = await Users.findOne({ email }).select("+password").populate({
      path: "friends",
      select: "firstName lastName location profileUrl -password",
    });

    if (!user) {
      next("Invalid email or password!");
      return;
    }
    if (!user.verified) {
      next("User email is not verified.Check your email to verify your account!");
      return;
    }
    const isMatch = await compareValues(password, user.password);
    if (!isMatch) {
      next("Invalid email or password!");
      return;
    }
    const token = generateToken(user._id);
    user.password = undefined;
    res.status(201).json({ success: true, message: "Login successfully", token, user });
  } catch (error) {}
};

export { register, login };

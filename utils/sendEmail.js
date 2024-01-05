import nodemailer from "nodemailer";

import { v4 as uuidv4 } from "uuid";
import { hashedValue } from "./index.js";
import Verfication from "../models/emailVerificationModel.js";
import dotenv from "dotenv";
import PasswordReset from "../models/passwordResetModel.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;
let transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASSWORD,
  },
});

export const sendVerificationEmail = async (user, res) => {
  const { _id, email, firstName } = user;
  const token = _id + uuidv4();
  const link = `${APP_URL}/users/verify/${_id}/${token}`;
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div
    style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
    <h3 style="color: rgb(8, 56, 188)">Please verify your email address</h3>
    <hr>
    <h4>Hi ${firstName},</h4>
    <p>
        Please verify your email address so we can know that it's really you.
        <br>
    <p>This link <b>expires in 1 hour</b></p>
    <br>
    <a href=${link}
        style="color: #fff; padding: 14px; text-decoration: none; background-color: #000;  border-radius: 8px; font-size: 18px;">Verify
        Email Address</a>
    </p>
    <div style="margin-top: 20px;">
        <h5>Best Regards</h5>
        <h5>TalkBuzz</h5>
    </div>
</div>`,
  };
  try {
    const hashedToken = await hashedValue(token);
    const newVerfiedEmail = await Verfication.create({
      userId: _id,
      token: hashedToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });
    if (newVerfiedEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING_VERIFICATION",
            message: "Email sent successfully, please check your email to verify your account",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(404).json({ status: "failed", message: "Email not sent" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Email not sent" });
  }
};

export const sendPasswordResetEmail = async (user, res) => {
  const { _id, email } = user;
  const token = _id + uuidv4();
  const link = `${APP_URL}/users/resetpassword/${_id}/${token}`;
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Password Reset",
    html: `<div
    style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
    <h3 style="color: rgb(8, 56, 188)">Reset your password</h3>
    <hr>
    <p>
        Please click the button below to reset your password.
        <br>
    <p>This link <b>expires in 10 minuts</b></p>
    <br>
    <a href=${link}
        style="color: #fff; padding: 14px; text-decoration: none; background-color: #000;  border-radius: 8px; font-size: 18px;">Reset
        Password</a>
    </p>
    <div style="margin-top: 20px;">
        <h5>Best Regards</h5>
        <h5>TalkBuzz</h5>
    </div>
</div>`,
  };
  try {
    const hashedToken = await hashedValue(token);
    const resetPassword = await PasswordReset.create({
      userId: _id,
      email,
      token: hashedToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    if (resetPassword) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "PENDING_VERIFICATION",
            message:
              "Reset password link sent successfully, please check your email to reset your password",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(404).json({ message: "Email not sent" });
        });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Email not sent" });
  }
};

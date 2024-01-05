import Verification from "../models/emailVerificationModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import Users from "../models/userModel.js";
import { compareValues, generateToken, hashedValue } from "../utils/index.js";
import { sendPasswordResetEmail } from "../utils/sendEmail.js";
import FriendRequest from "../models/friendRequestModel.js";

export const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const verificationResult = await Verification.findOne({ userId });

    if (verificationResult) {
      const { expiresAt, token: hashedToken } = verificationResult;

      if (expiresAt < Date.now()) {
        // Token has expired
        await Promise.all([
          Verification.findOneAndDelete({ userId }),
          Users.findOneAndDelete({ _id: userId }),
        ]);

        const message = "Verification token has expired.";
        return res.redirect(`/users/verified?status=error&message=${message}`);
      } else {
        // Token is valid
        const isTokenMatch = await compareValues(token, hashedToken);

        if (isTokenMatch) {
          await Promise.all([
            Users.findOneAndUpdate({ _id: userId }, { verified: true }),
            Verification.findOneAndDelete({ userId }),
          ]);

          return res.redirect(
            `/users/verified?status=success&message=Email verified successfully`
          );
        } else {
          return res.redirect(
            `/users/verified?status=error&message=Verification failed or link is invalid`
          );
        }
      }
    } else {
      // Invalid verification link
      return res.redirect(
        `/users/verified?status=error&message=Invalid verification link. Try again later.`
      );
    }
  } catch (error) {
    return res.redirect(`/users/verified?status=error&message=${error.message}`);
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Email address not found",
      });
    }
    const existingRequest = await PasswordReset.findOne({ email });
    if (existingRequest) {
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "PENDING",
          message: "Password reset request already sent",
        });
      }
      await PasswordReset.findOneAndDelete({ email });
    }
    await sendPasswordResetEmail(user, res);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Email not sent" });
  }
};

export const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const user = await Users.findById(userId);

    if (!user) {
      res.redirect(
        "/users/resetpassword?status=error&message=Invalid password reset link. Try again later."
      );
    }
    const resetPassword = await PasswordReset.findOne({ userId });
    if (!resetPassword) {
      res.redirect(
        "/users/resetpassword?status=error&message=Invalid password reset link. Try again later."
      );
    }
    const { expiresAt, token: resetToken } = resetPassword;
    if (expiresAt < Date.now()) {
      await PasswordReset.findOneAndDelete({ userId });
      res.redirect(
        "/users/resetpassword?status=error&message=Password reset link has expired. Try again later."
      );
    } else {
      const isMatch = await compareValues(token, resetToken);
      if (!isMatch) {
        res.redirect(
          "/users/resetpassword?status=error&message=Invalid password reset link. Try again later."
        );
      } else {
        res.redirect(`/users/resetpassword?type=reset&id=${userId}`);
      }
    }
  } catch (error) {
    console.log("error", error);
    res.status(404).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const hashedPassword = await hashedValue(password);
    const user = await Users.findOneAndUpdate({ _id: userId }, { password: hashedPassword });
    if (user) {
      await PasswordReset.findOneAndDelete({ userId });
      res.status(200).json({ ok: true });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.params;
    const user = await Users.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    user.password = undefined;
    res.status(200).json({ message: "success", user });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, location, profileUrl, profession } = req.body;
    if (!firstName || !lastName || !location || !profileUrl || !profession) {
      next("All fields are required");
      return;
    }

    const { userId } = req.body.user;
    const updatedUser = {
      firstName,
      lastName,
      location,
      profileUrl,
      profession,
    };

    const user = await Users.findOneAndUpdate({ _id: userId }, updatedUser, { new: true });
    await user.populate({
      path: "friends",
      select: "-password",
    });
    const token = generateToken(user._id);
    user.password = undefined;
    res.status(200).json({ message: "User updated successfully", user, token });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const friendRequest = async (req, res, next) => {
  try {
    console.log("req", req.body);
    const { userId } = req.body.user;
    const { requestTo } = req.body;
    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    }); //check if the logged in user has sent a request to the user
    if (requestExist) {
      next("Request already sent");
      return;
    }
    const accountExist = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    }); //check if the user has sent a request to the logged in user
    if (accountExist) {
      next("Request already sent");
      return;
    }
    const newRequest = await FriendRequest.create({
      requestFrom: userId,
      requestTo,
    });
    res.status(201).json({ message: "Request sent successfully" });
  } catch (error) {
    res.status(500).json({
      message: "auth error",
      error: error.message,
    });
  }
};
export const getFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({
        _id: -1,
      });

    res.status(200).json({ message: "success", data: request });
  } catch (error) {
    res.status(500).json({
      message: "auth error",
      error: error.message,
    });
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { rid, status } = req.body;
    const requestExist = await FriendRequest.findById(rid);
    if (!requestExist) {
      next("Request not found");
      return;
    }
    const newRes = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status }
    );

    if (status === "Accepted") {
      const user = await Users.findById(userId); //logged in user
      user.friends.push(newRes?.requestFrom); //add the user to the logged in user's friend list
      await user.save();
      const friend = await Users.findById(newRes?.requestFrom); //user that sent the request
      friend.friends.push(newRes?.requestTo); //add the logged in user to the user's friend list
      await friend.save();
    }
    res.status(201).json({
      message: `Friend Request ${status} `,
    });
  } catch (error) {
    res.status(500).json({
      message: "auth error",
      error: error.message,
    });
  }
};

export const profileViews = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { id } = req.body;

    const user = await Users.findById(id);
    user.views.push(userId);
    await user.save();
    res.status(201).json({
      message: "Profile viewed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "auth error",
      error: error.message,
    });
  }
};

export const suggetedFriends = async (req, res) => {
  try {
    const { userId } = req.body.user;
    let queryObj = {};
    queryObj._id = { $ne: userId }; //exclude logged in user
    queryObj.friends = { $nin: userId }; //exclude friends of logged in user
    const suggetedFriends = await Users.find(queryObj)
      .limit(15)
      .select("firstName lastName profileUrl profession -password");
    res.status(200).json({ message: "success", data: suggetedFriends });
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};

import express from "express";
import path from "path";
import {
  acceptRequest,
  changePassword,
  friendRequest,
  getFriendRequest,
  getUser,
  profileViews,
  requestPasswordReset,
  resetPassword,
  suggetedFriends,
  updateUser,
  verifyEmail,
} from "../controllers/userController.js";
import userAuth from "../middleware/authMiddleware.js";

const router = express.Router();

const __dirname = path.resolve(path.dirname("")); // path to root folder of project
//verify email
router.get("/verify/:userId/:token", verifyEmail);
router.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build", "index.html"));
});
router.get("/getuser/:id?", userAuth, getUser);
router.put("/updateprofile", userAuth, updateUser);

//reset password
router.post("/requestpasswordreset", requestPasswordReset);
router.get("/resetpassword/:userId/:token", resetPassword);
router.post("/reset-password", changePassword);

router.get("/resetpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/build", "index.html"));
});

//friend request

router.post("/friendrequest", userAuth, friendRequest);
router.get("/getfriendrequest", userAuth, getFriendRequest);
router.post("/acceptrequest", userAuth, acceptRequest);

//view profile
router.post("/profileviews", userAuth, profileViews);
//suggeted friends
router.get("/suggetedfriends", userAuth, suggetedFriends);
export default router;

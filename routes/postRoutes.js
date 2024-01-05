import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  getUserPost,
  getComments,
  likePost,
  likePostComment,
  commentPost,
  replyPostComment,
  deletePost,
} from "../controllers/postController.js";
import userAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createpost", userAuth, createPost); //create post
router.post("/", userAuth, getPosts); //get all posts
router.get("/:postId", userAuth, getPost); //get single post by id
router.get("/getuserpost/:userId", userAuth, getUserPost); //get user post by id
router.get("/comments/:postId", userAuth, getComments); //get comments by post id
router.post("/like/:postId", userAuth, likePost); //like post
router.post("/likecomment/:commentId/:rid?", userAuth, likePostComment); //like comment/reply
router.post("/comment/:postId", userAuth, commentPost); //post comment
router.post("/replycomment/:commentId", userAuth, replyPostComment); //post reply
router.delete("/:postId", userAuth, deletePost); //delete post
export default router;

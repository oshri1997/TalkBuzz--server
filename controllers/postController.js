import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";
import Comments from "../models/commentModel.js";
export const createPost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { description, image } = req.body;
    console.log(image);
    if (!description) {
      next("You must provide a description");
      return;
    }
    const newPost = await Posts.create({
      userId,
      description,
      image,
    });
    res.status(200).json({
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getPosts = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { search } = req.body;
    const user = await Users.findById(userId);
    const friends = user?.friends?.toString().split(",") || [];
    friends.push(userId);

    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    const friendsPosts = posts?.filter((post) =>
      friends.includes(post?.userId?._id.toString())
    );
    const otherPosts = posts?.filter(
      (post) => !friends.includes(post?.userId?._id.toString())
    );

    let postsRes =
      friendsPosts?.length > 0
        ? search
          ? friendsPosts
          : [...friendsPosts, ...otherPosts]
        : posts;

    res.status(200).json({
      success: true,
      message: "Successfully retrieved posts",
      data: postsRes,
    });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: error.message });
  }
};
export const getPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Posts.findById(postId).populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password",
    });
    res.status(200).json({
      message: "Post fetched successfully",
      data: post,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const getUserPost = async (req, res, next) => {
  const { userId } = req.params;
  const post = await Posts.find({ userId })
    .populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password",
    })
    .sort({ _id: -1 });
  res.status(200).json({
    message: "User post fetched successfully",
    data: post,
  });
};
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const postComments = await Comments.find({ postId })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .populate({
        path: "replies.userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      message: "Comments fetched successfully",
      data: postComments,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const likePost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { postId } = req.params;
    const post = await Posts.findById(postId);
    const index = post.likes.findIndex((pid) => pid === String(userId)); //check if user already liked the post
    if (index === -1) {
      post.likes.push(userId); //like the post
    } else {
      post.likes = post.likes.filter((id) => id !== String(userId)); //unlike the post
    }
    const newPost = await Posts.findByIdAndUpdate(postId, post, {
      new: true,
    });
    res.status(200).json({
      message: "Post liked successfully",
      data: newPost,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const likePostComment = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { commentId, rid } = req.params;
    console.log("rid", rid);
    if (rid === undefined || rid === null || rid === "false") {
      const comment = await Comments.findById(commentId);
      const index = comment.likes.findIndex((pid) => pid === String(userId));
      if (index === -1) {
        comment.likes.push(userId);
      } else {
        comment.likes = comment.likes.filter((id) => id !== String(userId));
      }
      const newComment = await Comments.findByIdAndUpdate(commentId, comment, {
        new: true,
      });
      res.status(200).json({
        message: "Comment liked successfully",
        data: newComment,
      });
    } else {
      const replyComments = await Comments.findOne(
        { _id: commentId },
        {
          replies: {
            $elemMatch: {
              _id: rid,
            },
          },
        }
      );

      const index = replyComments.replies[0].likes.findIndex((pid) => pid === String(userId));
      if (index === -1) {
        replyComments.replies[0].likes.push(userId);
      } else {
        replyComments.replies[0].likes = replyComments.replies[0].likes.filter(
          (id) => id !== String(userId)
        );
      }
      const qurey = {
        _id: commentId,
        "replies._id": rid,
      };
      const updated = {
        $set: {
          "replies.$.likes": replyComments.replies[0].likes,
        },
      };
      const result = await Comments.updateOne(qurey, updated, { new: true });
      res.status(200).json({
        message: "Comment unliked/liked successfully",
        data: result,
      });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const commentPost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { postId } = req.params;
    const { comment, from } = req.body;
    if (!comment) {
      return res.status(404).json({ message: "Comment is required" });
    }
    const newComment = await Comments.create({
      userId,
      postId,
      comment,
      from,
    });
    const post = await Posts.findById(postId);
    post.comments.push(newComment._id);
    await Posts.findByIdAndUpdate(postId, post, { new: true }); //update post with the new comment
    res.status(200).json({
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const replyPostComment = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { commentId } = req.params;
    const { comment, replyAt, from } = req.body;
    if (!comment) {
      return res.status(404).json({ message: "Comment is required" });
    }
    const commentData = await Comments.findById(commentId);
    const newReply = {
      userId,
      comment,
      replyAt,
      from,
      createdAt: Date.now(),
    };
    commentData.replies.push(newReply);
    const updatedReply = await Comments.findByIdAndUpdate(commentId, commentData, {
      new: true,
    });
    res.status(200).json({
      message: "Reply added successfully",
      data: updatedReply,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    await Posts.findByIdAndDelete(postId);
    await Comments.deleteMany({ postId }); //delete all comments of the post
    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

import JWT from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    next("Authentication failed");
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET_KEY;
  try {
    const decoded = JWT.verify(token, secret);
    req.body.user = {
      userId: decoded.userId,
    };
    next();
  } catch (error) {
    next("Authentication failed");
  }
};

export default userAuth;

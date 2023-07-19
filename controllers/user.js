import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../errors/index.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new BadRequestError("email required");
  }

  if (!password) {
    throw new BadRequestError("password required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new NotFoundError("email is not registered");
  }

  const isPasswordMatch = await user.matchPassword(password);

  console.log(isPasswordMatch);

  if (!isPasswordMatch) {
    throw new UnauthorizedError("wrong password");
  }

  const token = await user.createJWT();

  return res.status(StatusCodes.OK).cookie("token", token, { sameSite: "none", secure: true, httpOnly: true }).json({ success: true });
};

export const signUp = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username) {
    throw new BadRequestError("username required");
  }

  if (!email) {
    throw new BadRequestError("username required");
  }

  if (!password) {
    throw new BadRequestError("username required");
  }

  const user = await User.create({ ...req.body });

  return res.status(StatusCodes.CREATED).json({ success: true });
};

export const passportCallback = async (accessToken, refreshToken, profile, done) => {
  // console.log(profile._json);
  let user = await User.findOne({
    email: profile._json.email,
  });

  let token;

  console.log(user);
  if (!user) {
    user = await User.create({
      username: profile.displayName,
      email: profile._json.email,
      isGoogleUser: true,
    });
  }

  token = jwt.sign(
    {
      username: user.username,
      userId: user._id,
      role: user.role,
      isGoogleUser: user.isGoogleUser,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );

  done(null, { token });
};

export const googleAuthCallback = (req, res) => {
  //Token passed by passport
  const { token } = req.user;

  return res.status(StatusCodes.OK).cookie("token", token, { sameSite: "none", secure: true, httpOnly: true }).json({ success: true });
};

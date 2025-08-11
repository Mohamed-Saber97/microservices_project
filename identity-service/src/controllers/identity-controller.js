const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const logger = require("../utils/logger");
const generateToken = require("../utils/generateToken");
const { validateRegister, validateLogin } = require("../utils/validate");

//register

const registerUser = async (req, res) => {
  try {
    logger.info("Registration endpoint 0.....");
    const { error } = validateRegister(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, username, password } = req.body;
    let user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      logger.warn("user exists");
      return res.status(400).json({
        success: false,
        message: "user exists",
      });
    }

    user = new User({
      username,
      email,
      password,
    });
    await user.save();
    logger.warn("User registered successfully!");
    const { accessToken, refreshToken } = await generateToken(user);
    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//login

const loginUser = async (req, res) => {
  try {
    logger.info("login user hit....0");
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    //check email and password

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("invalid user");
      return res.status(400).json({
        success: false,
        message: "incalid user",
      });
    }
    //verfiy password
    const isValidPass = await user.comparePassword(password);
    if (!isValidPass) {
      logger.warn("Invalid data");
      return res.status(400).json({
        success: false,
        message: "incalid user",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.json({
      accessToken,
      refreshToken,
      ID: user._id,
    });
  } catch (error) {}
};

//refresh token

const refreshTokenUser = async (req, res) => {
  try {
    // token in req body
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("RefreshToken Missing");
      return res.status(400).json({
        success: false,
        message: "RefreshToken Missing",
      });
    }

    // token in database and not expired
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(storedToken.usre);
    if (!user) {
      logger.warn("UserNot Found");
      return res.status(400).json({
        success: false,
        message: "UserNot Found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    //delete the old refreshToken
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



//update



//delet




//logout

const logoutUser = async(req, res) => {
  logger.info('logout hit....');
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("RefreshToken Missing");
      return res.status(400).json({
        success: false,
        message: "RefreshToken Missing",
    });
  }



    await RefreshToken.deleteOne({token: refreshToken});
    logger.info('refrehtoken deleted for logout');
    res.json({
      success: true,
      message: 'logout sucess'

    });



  } catch (error) {
    logger.error("while logout", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser
};

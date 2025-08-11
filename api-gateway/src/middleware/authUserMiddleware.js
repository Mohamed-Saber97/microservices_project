const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const authHeadr = req.headers["authorization"];
  const token = authHeadr && authHeadr.split(" ")[1];
  if (!token) {
    logger?.warn?.("Invaild token before verify from api gateway");
    return res.status(401).json({
      success: false,
      message: " auth required invaild token before verify api gateway",
    });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger?.warn?.("invaild token during verify api gateway");
      return res.status(401).json({
        success: false,
        message: "invaild token during verify api gateway",
      });
    }

    req.user = user;
    //Valid → add the user payload to req.user and call next() to continue.

    next();
  });

  // if(!authHeadr) {
  //     logger?.error?.('Authoriaztion header missing');
  //     return res.status(401).json({
  //       success: false,
  //       message: "Authoriaztion header missing",
  //     });
  // }

  // try {
  //     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  //     if(!decodedToken) {
  //         logger?.warn?.('wrong token');
  //         return res.status(401).json({
  //           success: false,
  //           message: "wrong token",
  //         });
  //     }

  // } catch (error) {

  // }
};

module.exports = validateToken;

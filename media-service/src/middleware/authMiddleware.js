const logger = require('../utils/logger');

const authUserReq = (req, res, next)=> {
    // from api gateway
    const userId = req.headers["x-user-id"];
    if(!userId) {
        logger.warn('not authenticated user please login first');
        return res.status(401).json({
            success: false,
            message: 'not authenticated user please login first'
        });
    }
    req.user = {userId};
    next();
}


module.exports = {authUserReq};
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const generateToken = async(user) => {
    //creating a access token
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username

    }, process.env.JWT_SECRET, {expiresIn: '60m'});
    //Node's built-in crypto module to generate a secure random refresh token.
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);   //refresh token expoires in 7 days
    //save Refresh Token in DB
    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    });

    return {accessToken, refreshToken};

}


module.exports = generateToken;
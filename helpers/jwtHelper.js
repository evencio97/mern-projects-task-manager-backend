require('dotenv').config({ path: '.env' });
const jwt = require('jsonwebtoken');
const moment = require('moment');

const secretKey = process.env.SECRET_KEY;

const createToken = (user) => {
    try {
        let payload = {
            _id: user._id,
            iat: moment().unix(),
            exp: moment().add(4, 'days').unix()
        }
        return jwt.sign(payload, secretKey);
    } catch (error) {
        return null;
    }
}

const verifyToken = async (token) => {
    return await jwt.verify(token, secretKey, function (error, decoded) {
        if (error || !decoded){
            // Token expirer
            if ('name' in error && error.name === 'TokenExpiredError') return -1;
            // Token invalid
            else return -2;
        }
        // Valid token
        return decoded;
    });
}

module.exports = {
    createToken,
    verifyToken
};
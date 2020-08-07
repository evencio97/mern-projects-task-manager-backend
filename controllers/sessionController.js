'use strict'
// Models
const Session = require('../models/Session');
const User = require('../models/User');
// Helpers
const { sessionPrivacy } = require('../helpers/privacyHelper');
const { createToken } = require('../helpers/jwtHelper');

const deactivateSession = async (token) => {
    try {
        let result = await Session.findOneAndUpdate({ token, active: 1 }, 
            { $set:{ active: 0, logout_at: Date.now() }}).exec();
        // Check result
        if (!result) return false;

        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getSessionMiddleware = async (token) => {
    try {
        let session = await Session.findOne({ token }).exec();
        // Check result
        if (!session) return null;

        return session;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const create = async (user) => {
    try {
        // Create token
        let token = createToken(user);
        if (!token) return null;
        // Save session
        let session = new Session({ user: user._id, token, active: 1 });
        session = await session.save();
        // Validate session
        if (!session) return null;
        // Add session to user
        User.findOneAndUpdate({ _id: user._id }, { $push:{ sessions: session._id }}).exec();
        return token;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const logout = async (req, res) => {
    try {
        let session = req.session;
        // Logout session
        if (!await deactivateSession(session.token))
            return res.status(500).json({ result: 'Error', message: 'Faild updating session', error: true, errorCode: 'serverError' });

        return res.status(200).json({ result: 'Success', message: 'Logout successfull', error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const check = async (req, res) => {
    try {
        if (!'session' in req) throw true;
        let session = req.session;
        // Refresh token if is 2 days old
        let auxDate = new Date();
        if (!('refresh_at' in session && session.refresh_at)) auxDate.setDate(session.created_at.getDate() + 2);
        else auxDate.setDate(session.refresh_at.getDate() + 2);
        // Check if have to refresh token
        if (auxDate <= Date.now()){
            // New token
            let token= createToken(session.user);
            if (!token)
                return res.status(500).json({ result: 'Error', message: 'Faild refresh session', error: true, errorCode: 'serverError' });
            // Update session
            session = await Session.findOneAndUpdate({ _id: session._id, active: 1 }, 
                { $set:{ token, refresh_at: Date.now() }}, { new: true }).exec();
            // Check result
            if (!session)
                return res.status(500).json({ result: 'Error', message: 'Faild refresh session', error: true, errorCode: 'serverError' });
        }

        return res.status(200).json({ result: 'Success', message: 'Session refresh successfully', 
            token: session.token, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

module.exports = {
    getSessionMiddleware,
    deactivateSession,
    create,
    logout,
    check
};
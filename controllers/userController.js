'use strict'
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
// Models
const User = require('../models/User');
const Session = require('../models/Session');
const Project = require('../models/Project');
// Controllers
const SessionController = require('./sessionController');
// const ProjectController = require('./projectController');
// Helpers
const { userPrivacy } = require('../helpers/privacyHelper');

const create = async (req, res) => {
    try {
        // Valided request 
        const errors = validationResult(req);
        if(errors && errors.errors.length)
            return res.status(400).json({ result: 'Error', error: true, errors: errors.errors, errorCode: 'badRequest' });
        
        let params = req.body;
        if(params.confirmedPassword !== params.password)
            return res.status(400).json({ result: 'Error', message: 'Password confirmation fail', error: true, errorCode: 'badConfirmedPassword' });
        
        // check if user already exist
        let user = await User.findOne({ email: params.email, deleted_at: null }).exec();
        if (user)
            return res.status(403).json({ result: 'Error', message: 'The user already exist', error: true, errorCode: 'emailExist' });
        
        const salt = await bcrypt.genSalt(10);
        user = new User({
            name: params.name,
            lastname: params.lastname,
            email: params.email,
            password: await bcrypt.hash(params.password, salt),
            sessions: [], projects: []
        });
        // Save user
        let userStored = await user.save();
        if (!userStored)
            return res.status(500).json({ result: 'Error', message: 'The user could not be saved', error: true, errorCode: 'serverError' });
        // Create session
        let token = await SessionController.create(user);
        if (!token)
            return res.status(500).json({ result: 'Error', message: 'The session could not be created', error: true, errorCode: 'serverError' });
        // Last touches
        userStored = userPrivacy(userStored);
        res.status(200).json({ result: 'Success', message: 'User successfully created', user: userStored,
            token, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const login = async (req, res) => {
    try {
        let params = req.body;
        // Valided request
        const errors = validationResult(req);
        if(errors && errors.errors.length)
            return res.status(400).json({ result: 'Error', error: true, errors: errors.errors, errorCode: 'badRequest' });        
        // Get user
        let user = await User.findOne({ email: params.email, deleted_at: null }).exec();
        if (!user)
            return res.status(404).json({ result: 'Error', message: "The user don't exist", error: true, errorCode: 'emailNotFind' });
        // Check password 
        if (!await bcrypt.compare(params.password, user.password))
            return res.status(403).json({ result: 'Error', message: 'The password is incorrect', error: true, errorCode: 'badPassword' });
        // Create session
        let token = await SessionController.create(user);
        if (!token)
            return res.status(500).json({ result: 'Error', message: 'The session could not be created', error: true, errorCode: 'serverError' });
        // Get projects
        // user.projects= await ProjectController.userProjects(user);
        // Last touches
        user= userPrivacy(user);
        res.status(200).json({ result: 'Success', message: 'Login successful', user: user, token, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const update = async (req, res) => {
    try {
        // Valided request 
        const errors = validationResult(req);
        if(errors && errors.errors.length)
            return res.status(400).json({ result: 'Error', error: true, errors: errors.errors, errorCode: 'badRequest' });
        
        let params = req.body;
        let session = req.session;
        // Update user
        let user = await User.findOneAndUpdate({ _id: session.user, deleted_at: null }, { $set: params}, { new: true }).exec();
        // Check result
        if (!user)
            return res.status(404).json({ result: 'Error', message: "The user don't exist", error: true, errorCode: 'notFind' });
        // Last touches
        user = userPrivacy(user);
        res.status(200).json({ result: 'Success', message: 'User successfully updated', user, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const deleteUser = async (req, res) => {
    try {
        // Valided request 
        if(!('password' in req.body && typeof req.password === "string"))
            return res.status(403).json({ result: 'Error', error: true, message: 'Need password', errorCode: 'missingPassword' });
        
        let password = req.body.password;
        let session = req.session;
        // Get user
        let user = await User.findOne({ _id: session.user, deleted_at: null }).exec();
        if (!user)
            return res.status(404).json({ result: 'Error', message: "The user don't exist", error: true, errorCode: 'notFind' });
        // Check password 
        if (!await bcrypt.compare(password, user.password))
            return res.status(403).json({ result: 'Error', message: 'The password is incorrect', error: true, errorCode: 'badPassword' });        
        
        // Delete user
        user = await User.findOneAndUpdate({ _id: user._id }, 
            { $set: { deleted_at: Date.now() }}, { new: true }).exec();
        // Check result
        if (!(user && 'deleted_at' in user && user.deleted_at)) throw true;
        // Delete sessions
        Session.deleteMany({ user: user._id }).exec();
        // Delete projects
        Project.deleteMany({ user: user._id }).exec();
        
        return res.status(200).json({ result: 'Success', message: 'User successfully deleted', error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const get = async (req, res) => {
    try {
        let session = req.session;
        // Get user
        let user = await User.findOne({ _id: session.user, deleted_at: null }).exec();
        // Check result
        if (!user)
            return res.status(404).json({ result: 'Error', message: "The user don't exist", error: true, errorCode: 'notFind' });
        // Last touches
        user = userPrivacy(user);
        res.status(200).json({ result: 'Success', message: 'User successfully get', user, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

module.exports = {
    create,
    login,
    update,
    deleteUser,
    get
};
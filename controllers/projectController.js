'use strict'
const { validationResult } = require('express-validator');
// Models
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
// Controllers
const TaskController = require('./taskController');
// Helpers
const { projectPrivacy } = require('../helpers/privacyHelper');

var forPage= 15;

const paginatedProjects = async (id, page=1) => {
    try {
        let aux= {total: 0, results: [], page: 1, lastPage: 1};
        let projects= await Project.aggregate(
            [
                { "$match": { user: id, deleted_at: null }},
                { "$sort": { created_at: -1 } },
                { "$project": { "user": 0, tasks: 0 }},
                { "$group": { '_id': null, 'total': { '$sum': 1 }, 'results': { '$push': '$$ROOT' } }},
                { "$project": { "_id": 0, "total": 1, "results": { "$slice": ['$results', forPage*(page-1), forPage] }}}
            ]
        ).exec();
        // Last touches
        projects= projects.length? projects[0]:aux;
        projects.lastPage= Math.ceil(projects.total/forPage);
        projects.page= page;
        return projects;
    } catch (error) {
        console.log(error);
        return aux;
    }
}

const create = async (req, res) => {
    try {
        let session= req.session;
        let params= req.body;
        // Valided request 
        const errors = validationResult(req);
        if(errors && errors.errors.length)
            return res.status(400).json({ result: 'Error', error: true, errors: errors.errors, errorCode: 'badRequest' }); 
        // check if project already exist
        if (await Project.findOne({ name: params.name, user: session.user, deleted_at: null }).exec())
            return res.status(403).json({ result: 'Error', message: 'Already exist a project with the same name', error: true, errorCode: 'projectExist' });
        
        let project = new Project({
            user: session.user,
            name: params.name,
            tasks: []
        });
        // Save project
        project = await project.save();
        if (!project) throw true
        // Add project to user
        let aux = await User.findOneAndUpdate({ _id: session.user }, { $push:{ projects: project._id }}).exec();
        if (!aux) throw true
        // Last touches
        project= projectPrivacy(project);
        return res.status(200).json({ result: 'Success', message: 'Project successfully created', project, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const update = async (req, res) => {
    try {
        let params= req.body; let session= req.session;
        let id= req.params.id;
        // Valided request 
        if(!('name' in params && typeof params.name === "string" && params.name.trim().length))
            return res.status(400).json({ result: 'Error', message: "Missing or invalid name", error: true, errorCode: 'badRequest' });
        // check if project already exist
        if (await Project.findOne({ name: params.name, user: session.user, deleted_at: null }).exec())
            return res.status(403).json({ result: 'Error', message: 'Already exist a project with the same name', error: true, errorCode: 'projectExist' });
        // Update project
        let project = await Project.findOneAndUpdate({ _id: id, user: session.user, deleted_at: null }, 
            { $set: { name: params.name } }, { new: true }).exec();
        // Check result
        if (!project)
            return res.status(404).json({ result: 'Error', message: "The project don't exist", error: true, errorCode: 'notFind' });
        // Last touches
        project= projectPrivacy(project);
        return res.status(200).json({ result: 'Success', message: 'Project successfully updated', project, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const deleteProject = async (req, res) => {
    try {
        let session = req.session;
        let id = req.params.id;
        // Delete project
        let project = await Project.findOneAndUpdate({ _id: id, user: session.user, deleted_at: null }, 
            { $set: { tasks: [], deleted_at: Date.now() }}).exec();
        if (!project)
            return res.status(404).json({ result: 'Error', message: "The project don't exist", error: true, errorCode: 'notFind' });
        // Delete tasks
        await Task.deleteMany({ project: project._id }).exec();
        
        return res.status(200).json({ result: 'Success', message: 'Project successfully deleted', error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const get = async (req, res) => {
    try {
        let session = req.session;
        let id = req.params.id;
        // Get project
        let project = await Project.findOne({ _id: id, user: session.user, deleted_at: null }).exec();
        if (!project)
        return res.status(404).json({ result: 'Error', message: "The project don't exist", error: true, errorCode: 'notFind' });
        // Get tasks
        project= project.toObject();
        project.tasks= await TaskController.paginatedTask(project._id);
        return res.status(200).json({ result: 'Success', message: 'Project successfully get', project, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const getAll = async (req, res) => {
    try {
        let session = req.session;
        let page= 'page' in req.params && typeof req.params.page==="number"? req.params.page:1;
        // Get projects
        let projects = await paginatedProjects(session.user, page);
        // Get tasks for projects
        for (let project of projects.results) {
            // Last touches
            project= projectPrivacy(project);
        }
        return res.status(200).json({ result: 'Success', message: 'Projects successfully get', projects, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

module.exports = {
    userProjects,
    create,
    update,
    deleteProject,
    get,
    getAll
};
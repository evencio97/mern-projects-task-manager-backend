'use strict'
const mongoose = require('mongoose');
// Models
const Project = require('../models/Project');
const Task = require('../models/Task');

var forPage=5;

const paginatedTask = async (id, page=1) => {
    try {
        let aux= {total: 0, results: [], page: 1, lastPage: 1};
        let tasks= await Task.aggregate(
            [
                { "$match": { project: mongoose.Types.ObjectId(id), deleted_at: null }},
                { "$sort": { created_at: -1 } },
                { "$project": { "project": 0 }},
                { "$group": { '_id': null, 'total': { '$sum': 1 }, 'results': { '$push': '$$ROOT' } }},
                { "$project": { "_id": 0, "total": 1, "results": { "$slice": ['$results', forPage*(page-1), forPage] }}}
            ]
        ).exec();
        // Last touches
        tasks= tasks.length? tasks[0]:aux;
        tasks.lastPage= tasks.total===0? 1:Math.ceil(tasks.total/forPage);
        tasks.page= page;
        return tasks;
    } catch (error) {
        console.log(error);
        return aux;
    }
}

const create = async (req, res) => {
    try {
        let params = req.body; let session= req.session;
        let proId = req.params.proId;
        // Valided request
        if(!('name' in params && typeof params.name === "string" && params.name.trim().length))
            return res.status(400).json({ result: 'Error', error: true, message:"Inalid name", errorCode: 'badRequest' });
        
        // Check if project exist
        let project= await Project.findOne({ _id: proId, user: session.user, deleted_at: null }).exec()
        if (!project)
            return res.status(404).json({ result: 'Error', message: 'The project not exist', error: true, errorCode: 'projectNotFind' });
        
        let task = new Task({
            project: project._id,
            name: params.name,
            status: 'status' in params && typeof params.status==="boolean"? params.status:false
        });
        // Save Task
        task = await task.save();
        if (!task) throw true;
        // Add task to project
        project= await Project.findOneAndUpdate({ _id: project._id }, { $push:{ tasks: task._id }}).exec();
        if (! project) throw true;
        
        return res.status(200).json({ result: 'Success', message: 'Task successfully created', task, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const update = async (req, res) => {
    try {
        let errors= []; let data= {};
        let session= req.session;
        let params= req.body;
        let proId= req.params.proId; let id= req.params.id;
        // Valided request 
        if('name' in params)
            if (!(typeof params.name === "string" && params.name.trim().length))
                errors.push({ message: "Invalid name", errorCode: "badName" });
            data.name= params.name;
        if('status' in params)
            if (!typeof params.status === "boolean")
                errors.push({ message: "Invalid name", errorCode: "badStatus" });
            data.status= params.status;
            
        // Update task
        let task = await Task.findOneAndUpdate({ _id: id, project: proId, deleted_at: null }, 
            { $set: data}, { new: true }).exec();
        // Check result
        if (!task)
            return res.status(404).json({ result: 'Error', message: "The task don't exist", error: true, errorCode: 'taskNotFind' });
        
        return res.status(200).json({ result: 'Success', message: 'Task successfully updated', task, 
            error: errors.length? true:false, errors });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const deleteTask = async (req, res) => {
    try {
        let session = req.session;
        let proId = req.params.proId;
        let id = req.params.id;
        // Delete task
        let task = await Task.findOneAndDelete({ _id: id, project: proId, deleted_at: null }).exec();
        if (!task)
            return res.status(404).json({ result: 'Error', message: "The task don't exist", error: true, errorCode: 'taskNotFind' });
        // Pull task from project
        let project = await Project.findOneAndUpdate({ _id: proId, user: session.user, deleted_at: null }, 
            { $pull: { tasks: mongoose.Types.ObjectId(id) }}, { multi: true, new: true }).exec();
        if (!project) throw true;
        
        return res.status(200).json({ result: 'Success', message: 'Task successfully deleted', error: false });
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
        let proId= req.params.proId;
        // Get task
        let task = await Task.findOne({ _id: id, project: proId, deleted_at: null }).exec();
        if (!task)
            return res.status(404).json({ result: 'Error', message: "The task don't exist", error: true, errorCode: 'taskNotFind' });
        
        return res.status(200).json({ result: 'Success', message: 'Task successfully get', task, error: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

const getAll = async (req, res) => {
    try {
        let session = req.session;
        let proId= req.params.proId;
        let page= 'page' in req.params && typeof req.params.page==="number"? req.params.page:1;
        // Get tasks
        let tasks = await paginatedTask(proId, page);
        
        return res.status(200).json({ result: 'Success', message: 'Tasks successfully get', tasks, error: false });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ result: 'Error', message: 'An error has occurred, please try again later.', 
            error: true, errorCode: 'serverError' });
    }
}

module.exports = {
    paginatedTask,
    create,
    update,
    deleteTask,
    get,
    getAll
};
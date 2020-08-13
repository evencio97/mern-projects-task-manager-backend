const express = require('express');
const router = express.Router();
// Controllers
const userController = require('../controllers/userController');
const sessionController = require('../controllers/sessionController');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
// Helpers
const { userValidatons, projectValidatons } = require('../helpers/validationHelper');
// Middlewares
const { checkAuth } = require('../middlewares/auth');

// Users
router.post('/register', 
    [ userValidatons.name, userValidatons.lastname, userValidatons.email, userValidatons.password, userValidatons.confirmedPassword ],
    userController.create
);
router.post('/login', 
    [ userValidatons.email, userValidatons.password ], 
    userController.login
);
router.get('/user', checkAuth, userController.get);
router.put('/user', checkAuth, 
    [ userValidatons.name, userValidatons.lastname, userValidatons.email, userValidatons.password, userValidatons.confirmedPassword ],
    userController.update
);
router.delete('/user', checkAuth, userController.deleteUser);
// Sessions
router.get('/logout', checkAuth, sessionController.logout);
router.get('/session/check', checkAuth, sessionController.check);
// Projects
router.get('/projects', checkAuth, projectController.getAll);
router.get('/project/:id', checkAuth, projectController.get);
router.post('/project', checkAuth,
    [ projectValidatons.name ], projectController.create
);
router.put('/project/:id', checkAuth, projectController.update);
router.delete('/project/:id', checkAuth, projectController.deleteProject);
// Task
router.get('/project/:proId/tasks', checkAuth, taskController.getAll);
router.get('/project/:proId/task/:id', checkAuth, taskController.get);
router.post('/project/:proId/task', checkAuth, taskController.create);
router.put('/project/:proId/task/:id', checkAuth, taskController.update);
router.delete('/project/:proId/task/:id', checkAuth, taskController.deleteTask);

module.exports = router;
const { check } = require('express-validator');

const userValidatons = {
    name: check('name', 'The name is required').isString(),
    lastname: check('lastname', 'The lastname is required').isString(),
    email: check('email', 'The email is required').isEmail(),
    password: check('password', 'The password is missing or is invalid').matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/),
    confirmedPassword: check('confirmedPassword', 'The password confirmation is required').isString(),
};

const projectValidatons = {
    name: check('name', 'The name is required').isString()
};

const taskValidatons = {
    name: check('name', 'The name is required').isString()
};

module.exports = {
    userValidatons,
    projectValidatons,
    taskValidatons
};
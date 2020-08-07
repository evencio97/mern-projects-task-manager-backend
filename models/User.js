'use strict'

const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: { type: String, require: true },
    lastname: { type: String, require: true },
    email: { type: String, require: true, trim: true, unique: true },
    password: { type: String, require: true },
    sessions: { type: Array, default: [] },
    projects: { type: Array, default: [] },
    deleted_at: Date,
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('User', UserSchema);
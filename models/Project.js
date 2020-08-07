'use strict'

const mongoose = require('mongoose');

const ProjectSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, require: true },
    name: { type: String, require: true },
    tasks: { type: Array, require: true, default: [] },
    deleted_at: Date,
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Project', ProjectSchema);
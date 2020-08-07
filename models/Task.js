'use strict'

const mongoose = require('mongoose');

const TaskSchema = mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, require: true },
    name: { type: String, require: true },
    status: { type: Boolean, require: true, default: false },
    deleted_at: Date,
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Task', TaskSchema);
'use strict'

const mongoose = require('mongoose');

const SessionSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, require: true },
    token: { type: String, require: true },
    active: { type: Number, require: true, default: 1 },
    refresh_at: Date,
    logout_at: Date
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Session', SessionSchema);
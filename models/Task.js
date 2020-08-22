const mongoose = require('mongoose');

// Task schema
const TaskSchema = new mongoose.Schema({
	taskid: {type: Number, unique: true, required: true},
	title: {type: String, unique: false, required: true},
	startDate: {type: String, unique: false, required: true}
});

module.exports = mongoose.model('Task', TaskSchema);

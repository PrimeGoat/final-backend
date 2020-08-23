const mongoose = require('mongoose');

// Task schema
const TaskSchema = new mongoose.Schema({
	taskid: {type: Number, unique: true, required: true},
	title: {type: String, unique: false, required: true},
	startDate: {type: String, unique: false, required: true},
	dueDate: {type: String, unique: false, required: true}
});
mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

module.exports = mongoose.model('Task', TaskSchema);

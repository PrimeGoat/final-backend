const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// List Schema
const ListSchema = new mongoose.Schema({
	listid: {type: Number, unique: true, required: true},
	title: {type: String, unique: false, required: true},
	tasks: [{type: Schema.Types.ObjectId, ref: 'Task'}]
});

module.exports = mongoose.model('List', ListSchema);

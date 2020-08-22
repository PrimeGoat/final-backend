const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
	boardName: {type: String, required: true}
});

module.exports = mongoose.model('Board', BoardSchema);

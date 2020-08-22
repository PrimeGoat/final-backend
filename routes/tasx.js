const express = require('express');
const router = express.Router();
const tasx = require('../models/tasxBoard');
const Task = require('../models/Task');
const List = require('../models/List');
const Board = require('../models/Board');

// Initial population of DB
const populateDB = function() {
	let newList = new List();
	let newTask = new Task();

	newTask.taskid = 234;
	newTask.title = "Test Task";
	newTask.startDate = "2020-04-20";
	newTask.dueDate = "3000-04-20";
	newTask.save();

	newList.listid = 123;
	newList.title = "Test List";
	newList.tasks = [newTask];
	newList.save();
}
//populateDB();

const nameBoard = function() {
	console.log("NAMING BOARD WTF");
	const board = new Board();
	board.boardName = "TASX Management";
	board.save();
}
//nameBoard();

/*\  ROUTES  /*\

* GET /board - Gets entire layout and content
* PUT /layout - Sends a bare (only IDs) layout.  This is sent whenever anything is moved around
* PUT /updatetask - Edits a task
* PUT /renameboard - Renames the board
* PUT /renamelist/:listid - Renames a list
* PUSH /newlist - Adds new list to end of lists
* PUSH /newtask/:listid - Adds new task to end of a list
* DELETE /deltask/:taskid - Deletes a task
* DELETE /dellist/:listid - Deletes a list and all of its tasks

\*/

// GET /board - Gets entire layout and content
router.get('/board', (req, res) => {
	console.log(JSON.stringify(tasx.board));
	getBoard(req, res);
});

// Gets lists from DB and sends to browser.
const getBoard = async function(req, res) {
	// Create a blank board
	const fullBoard = {
		title: '',
		lists: []
	}

	const board = await Board.findOne({});
	fullBoard.title = board.boardName;

	// Iterate through DB's lists
	const lists = await List.find({})
	for(list of lists) {
		console.log("List: ", list);
		const currentList = {
			listid: list.listid,
			title: list.title,
			tasks: []
		};

		// Iterate through DB's tasks for this list
		for(task of list.tasks) {
			task = await Task.find({_id: task});

			const currentTask = {
				taskid: task.taskid,
				title: task.title,
				startDate: task.startDate,
				dueDate: task.dueDate
			}
			currentList.tasks.push(currentTask);
		}
		fullBoard.lists.push(currentList);
	}

	// Send the board to the browser
	return res.status(200).json(fullBoard);
}

// PUT /renameboard - Renames the board
router.put('/renameboard', (req, res) => {
	renameBoardDB(req, res);
});

const renameBoardDB = async function(req, res) {
	const title = req.body.title.trim();
	console.log("Rename board request received: ", title);
	if(title != "") {
		//tasx.board.title = title;
		const board = await Board.findOne({});
		board.boardName = title;
		await board.save();
		console.log(`Board renamed to ${title}, sending client confirmation.`);
		return res.status(200).json({success: true, response: `Board renamed to ${title}`});
	} else {
		console.log("Renameboard: Invalid title, sending client rejection.");
		return res.status(500).json({success: false, response: 'Invalid title'});
	}
}


// PUSH /newlist - Adds new list to end of lists
router.post('/newlist', (req, res) => {
	if(!req.body.listid || !req.body.title) return res.status(500).json({success: false, response: 'Newlist: Invalid list parameters.'});

	tasx.board.lists.push(req.body);
	addListDB(req, res);
});

// Add a list to the DB
const addListDB = async function(req, res) {
	console.log("Adding this to DB: ", req.body);
	const list = new List();

	list.listid = req.body.listid;
	list.title = req.body.title;

	list.save();

	return res.status(200).json({success: true, response: 'New list added.'});
}

// PUT /renamelist - Renames a list
router.put('/renamelist/:id', (req, res) => {
	renameListDB(req, res);
});

// Rename list in DB
const renameListDB = async function(req, res) {
	const title = req.body.title.trim();
	const oldName = getListName(req.params.id);
	console.log("Rename list request received: ", title);

	if(await setListName(req.params.id, title)) {
		console.log(`List renamed: ${oldName} -> ${title}, sending client confirmation.`);
		return res.status(200).json({success: true, response: `List renamed: ${oldName} -> ${title}`});
	} else {
		console.log("List not found, sending client rejection.");
		return res.status(500).json({success: false, response: 'List not found.'});
	}
}

// Sets the name of the list with specified ID, or null if not found
const setListName = async function(id, newName) {
	id = id.toString();

	const list = await List.findOne({listid: id});

	if(list === null) return false;

	console.log("setListName: ", id, list.title);
	list.title = newName;
	list.save();

	/*
	for(let i = 0; i < tasx.board.lists.length; i++)
		if(tasx.board.lists[i].listid.toString() === id) {
			tasx.board.lists[i].title = newName;
			return true;
		}
	*/

	return true;
}


// DELETE /dellist/:listid - Deletes a list
router.delete('/dellist/:listid', (req, res) => {
	const index = getListName(req.params.listid, true);
	const name = tasx.board.lists[index].title;

	console.log("Delete list: ", index, name);

	if(name === null) {
		console.log("Delete list: Invalid list, sending client rejection.");
		return res.status(500).json({success: false, response: 'Delete list: Invalid list.'});
	}

	tasx.board.lists.splice(index, 1);

	console.log(`Task deleted: ID ${req.params.listid}, name ${name}.`);
	return res.status(200).json({success: true, response: `Task deleted: ID ${req.params.listid}, name ${name}.`});
});


// PUSH /newtask/:listid - Adds new task to end of a list
router.post('/newtask/:listid', (req, res) => {
	const listIndex = getListName(req.params.listid, true);
	if(!req.body.taskid || !req.body.title || listIndex === null) return res.status(500).json({success: false, response: 'Newtask: Invalid parameters.'});

	tasx.board.lists[listIndex].tasks.push(req.body);

	return res.status(200).json({success: true, response: 'New task added.'});
});

// PUT /updatetask - Edits a task
router.put('/updatetask', (req, res) => {
	const currentTaskIndex = getTaskById(req.body.taskid, true);

	if(currentTaskIndex != null) {
		tasx.board.lists[currentTaskIndex[0]].tasks[currentTaskIndex[1]] = req.body;
		return res.status(200).json({success: true, response: `Task ${req.body.taskid} updated.`});
	} else {
		console.log("Updatetask: Invalid task specified, sending client rejection.")
		return res.status(500).json({success: false, response: 'Invalid task ID'});
	}
});

// DELETE /deltask/:taskid - Deletes a task
router.delete('/deltask/:taskid', (req, res) => {
	const indexes = getTaskById(req.params.taskid, true);
	const name = getTaskById(req.params.taskid).title;

	console.log("Delete task: ", indexes, name);

	if(name === null) {
		console.log("Delete task: Invalid task, sending client rejection.");
		return res.status(500).json({success: false, response: 'Delete task: Invalid task.'});
	}

	tasx.board.lists[indexes[0]].tasks.splice(indexes[1], 1);

	console.log(`Task deleted: ID ${req.params.taskid}, name ${name}.`);
	return res.status(200).json({success: true, response: `Task deleted: ID ${req.params.taskid}, name ${name}.`});
});

//  [
//   { listid: 'DOING', tasks: [ '4' ] },
//   { listid: 'TODO', tasks: [ '1', '2' ] },
//   { listid: 'DONE', tasks: [] }
// ]

// PUT /layout - Sends a bare (only IDs) layout.  This is sent whenever a task or list is moved around.
router.put('/layout', (req, res) => {
	console.log("Received an updated layout: ", req.body);

	const newLists = [];

	for(let i = 0; i < req.body.length; i++) {
		let listName = getListName(req.body[i].listid);
		if(listName == null) {
			return res.status(500).json({success: false, response: 'Invalid list ID encountered.'});
		}
		let entry = {
			listid: req.body[i].listid,
			title: listName,
			tasks: []
		};

		for(task of req.body[i].tasks) {
			let taskName = getTaskById(task);
			if(taskName == null) {
				return res.status(500).json({success: false, response: 'Invalid task ID encountered.'});
			}
			entry.tasks.push(taskName);
		}
		newLists.push(entry);
	}

	tasx.board.lists = [...newLists];

	return res.status(200).json({success: true, response: 'New layout saved.'});
});

// Returns the name of the list with specified ID, or null if not found
const getListName = function(id, index = false) {
	id = id.toString();
	for(let i = 0; i < tasx.board.lists.length; i++)
		if(tasx.board.lists[i].listid.toString() === id) {
			if(index) return i;
			else return tasx.board.lists[i].title;
		}
	return null;
}

const wtf = function(hey) {
	console.log(hey);
}

// Returns a task with specified ID, or null if not found
const getTaskById = function(id, index = false) {
	id = id.toString();
	for(let i = 0; i < tasx.board.lists.length; i++) {
		for(let j = 0; j < tasx.board.lists[i].tasks.length; j++) {
			if(tasx.board.lists[i].tasks[j].taskid.toString() === id) {
				if(index) return [i, j];
				else return tasx.board.lists[i].tasks[j];
			}
		}
	}
	return null;
}

/*
router.get('/:id', (req, res) => {
    const user = users.filter(user => user.id === req.params.id);

    if(user.length == 0) {
    return res.status(404).json({confirmation: 'failed', message: "User not found"});
    }

    return res.status(200).json({confirmation: 'success', user});
    //res.send(req.params.id);
});

/*
// create user
router.post('/', (req, res) => {
    return res.json(req.body);
});


// create user
router.post('/', (req, res) => {
    if(!req.body.name || !req.body.email || !req.body.password) {
        return res
            .status(400)
            .json({ confirmation: "failed", message: "You must specify username, email, password"})
    }

    const user = users.filter(user => user.email === req.body.email);

    if(user.length > 0) {
        return res.status(400).json({ confirmation: 'fail', message: "user already exists" });
    }

    let newUser = {};

    newUser.id = Date.now();
    newUser.name = req.body.name;
    newUser.email = req.body.email;
    newUser.password = req.body.password;

    users.push(newUser);

    return res.status(201).json({ message: 'User created', users })
});

// Update user
router.put('/:id', (req, res) => {
    const user = users.filter(user => user.email === req.body.email);
    let updatedUser = req.body;

    if(user.length > 0) {
        user.name = updatedUser.name ? updatedUser.name : user.name;
        user.email = updatedUser.email ? updatedUser.email : user.email;
    }
});

// Delete user
router.delete('/:id', (req, res) => {
    const user = users.filter(user => user.id !== req.params.id);

    return res.status(200).json({ message: 'User deleted', user });
});
*/

router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

module.exports = router;

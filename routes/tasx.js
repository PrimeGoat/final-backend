const express = require('express');
const router = express.Router();
const tasx = require('../models/tasxBoard');

/*\  ROUTES  /*\

* GET /board - Gets entire layout and content
* PUT /layout - Sends a bare (only IDs) layout.  This is sent whenever anything is moved around
* PUT /updatetask - Edits a task
* PUT /renameboard - Renames the board
* PUT /renamelist/:listid - Renames a list
PUSH /newlist - Adds new list to end of lists
PUSH /newtask/:listid - Adds new task to end of a list
DELETE /deltask/:taskid - Deletes a task
DELETE /dellist/:listid - Deletes a list and all of its tasks

\*/

// GET /board - Gets entire layout and content
router.get('/board', (req, res) => {
	console.log(JSON.stringify(tasx.board));
	return res.status(200).json(tasx.board);
});

// PUT /renameboard - Renames the board
router.put('/renameboard', (req, res) => {
	const title = req.body.title.trim();
	console.log("Rename board request received: ", title);
	if(title != "") {
		tasx.board.title = title;
		console.log(`Board renamed to ${title}, sending client confirmation.`);
		return res.status(200).json({success: true, response: `Board renamed to ${title}`});
	} else {
		console.log("Renameboard: Invalid title, sending client rejection.");
		return res.status(500).json({success: false, response: 'Invalid title'});
	}
});

// PUT /renamelist - Renames a list
router.put('/renamelist/:id', (req, res) => {
	const title = req.body.title.trim();
	const oldName = getListName(req.params.id);
	console.log("Rename list request received: ", title);
	if(title != "" && oldName != null) {
		setListName(req.params.id, title);
		console.log(`List renamed: ${oldName} -> ${title}, sending client confirmation.`);
		return res.status(200).json({success: true, response: `List renamed: ${oldName} -> ${title}`});
	} else {
		console.log("Invalid parameters, sending client rejection.");
		return res.status(500).json({success: false, response: 'Invalid parameters.'});
	}
});

// PUT /updatetask - Edits a task
router.put('/updatetask', (req, res) => {
	console.log(req.body);
	const currentTaskIndex = getTaskById(req.body.taskid, true);
	console.log("Index: ", currentTaskIndex);

	if(currentTaskIndex != null) {
		tasx.board.lists[currentTaskIndex[0]].tasks[currentTaskIndex[1]] = req.body;
		return res.status(200).json({success: true, response: `Task ${req.body.taskid} updated.`});
	} else {
		console.log("Updatetask: Invalid task specified, sending client rejection.")
		return res.status(500).json({success: false, response: 'Invalid task ID'});
	}
});

//  [
//   { listid: 'DOING', tasks: [ '4' ] },
//   { listid: 'TODO', tasks: [ '1', '2' ] },
//   { listid: 'DONE', tasks: [] }
// ]


// PUT /layout - Sends a bare (only IDs) layout.  This is sent whenever
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

		console.log("Processing tasks: ", req.body[i].tasks);
		for(task of req.body[i].tasks) {
			let taskName = getTaskById(task);
			if(taskName == null) {
				return res.status(500).json({success: false, response: 'Invalid task ID encountered.'});
			}
			entry.tasks.push(taskName);
		}
		console.log("Entry built: ", entry);
		newLists.push(entry);
	}

	tasx.board.lists = [...newLists];

	return res.status(200).json({success: true, response: 'New layout saved.'});
});

// Sets the name of the list with specified ID, or null if not found
const setListName = function(id, newName) {
	id = id.toString();

	for(let i = 0; i < tasx.board.lists.length; i++)
		if(tasx.board.lists[i].listid.toString() === id) {
			tasx.board.lists[i].title = newName;
			return true;
		}

	return null;
}

// Returns the name of the list with specified ID, or null if not found
const getListName = function(id) {
	id = id.toString();
	for(let list of tasx.board.lists)
		if(list.listid.toString() === id) return list.title;
	return null;
}

// Returns a task with specified ID, or null if not found
const getTaskById = function(id, index = false) {
	console.log("Received gettaskbyid request: ", id);
	id = id.toString();
	for(let i = 0; i < tasx.board.lists.length; i++) {
		for(let j = 0; j < tasx.board.lists[i].tasks.length; j++) {
			if(tasx.board.lists[i].tasks[j].taskid.toString() === id) {
				console.log("Found", i, j);
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

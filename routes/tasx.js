const express = require('express');
const router = express.Router();
const tasx = require('../models/tasxBoard');

/*\  ROUTES  /*\

GET /board - Gets entire structure
PUT /structure - Sends a bare (only IDs) structure.  This is sent whenever anything is moved around
PUT /task/:id - Edits a task
PUT /renameboard - Renames the board
PUT /renamelist/:listid - Renams a list
PUSH /newlist - Adds new list to end of lists
PUSH /newtask/:listid - Adds new task to end of a list
DELETE /deltask/:taskid - Deletes a task
DELETE /dellist/:listid - Deletes a list and all of its tasks

\*/

router.get('/board', (req, res) => {
	console.log("YO!!!");

	console.log(JSON.stringify(tasx.board));
	return res.status(200).json(tasx.board);
});

router.put('/renameboard', (req, res) => {
	console.log("Rename board received:");
	console.log(req.body);
	const title = req.body.title.trim();

	tasx.board.title = title;
	return res.status(200).json({success: true, response: `Board renamed to ${title}`});
});

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

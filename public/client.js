// API

/*\

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


var kanbanBoard = {
	title: "TASX",
	lists: []
};



const getBoard = function() {
	const request = new XMLHttpRequest();

	request.open('GET', 'http://localhost:3000/api/v1/board');

	request.onreadystatechange = () => {
		if(request.readyState === 4 && request.status === 200) {
			console.log(request.responseText);
			kanbanBoard = JSON.parse(request.responseText);
			clearBoard();
			populateBoard();
		}
	}

	request.send();
}

const sendApi = function(command, data = "") {
	const request = new XMLHttpRequest();

	let tail, body;

	switch(command) {
		case 'renameBoard':
			method = 'PUT';
			tail = 'renameboard';
			body = {
				title: data
			};
			break;
		default:
			console.log("Invalid command: " + command);
			return;
	}

	request.open(method, 'http://localhost:3000/api/v1/' + tail);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.onreadystatechange = () => {
		//console.log(request.readyState, request.status);
		if(request.readyState === 4 && request.status === 200) {
			const response = JSON.parse(request.responseText);
			if(response.success) {
				console.log(`API command ${command} success: ${response.response}`);
			} else {
				console.log(`API command ${command} failed: ${response.response}`);
			}
		}
	}
	request.send(JSON.stringify(body));
	console.log(JSON.stringify(body));
	console.log(`Sending API command: ${command} with data: ${data}`);
}

const setupSortables = function() {
	$( () => {
		$( ".listBody" ).sortable({
			connectWith: ".connectedSorts",
			stop: () => {
				const structure = getBoardStructure();
				console.log("Task item has been moved.");
			}
		}).disableSelection();
	} );

	$( () => {
		$( ".boardBody" ).sortable({
			axis: 'x',
			change: () => {
				const structure = getBoardStructure();
				console.log("List has been moved.");
			}
		}).disableSelection();
	} );
}

const clearBoard = function() {
	//const lists = document.querySelector("#insertLists");
	const lists = document.children[0].children[1].children[2].children[0].children[1];

	console.log(lists);
	while(lists.firstChild) lists.lastChild.remove();
}

const populateBoard = function() {
	const boardTitle = document.getElementById("boardTitle");
	boardTitle.innerText = kanbanBoard.title;

	console.log(kanbanBoard.lists);
	for(list of kanbanBoard.lists) {
		placeList(list.title, list.listid);

		for(task of list.tasks) {
			placeTask(list.listid, task.title, task.taskid, task.startDate != "", task.startDate, task.dueDate != "", task.dueDate);
		}
	}
	setupSortables();
}

const boardNaming = function() {
	const boardTitle = document.getElementById("boardTitle");
	const boardTitleEdit = document.getElementById("boardEdit");

	boardTitle.addEventListener('click', editBoard);

	boardTitleEdit.addEventListener('keyup', (event) => {
		if(event.key == 'Enter' || event.key == 'Escape') {
			saveBoardEdit(event.target);
		}
	});
	boardTitleEdit.addEventListener('blur', (event) => {
		saveBoardEdit(event.target);
	});
}

const editBoard = function(event) {
	const text = event.target.innerText;
	console.log("Board text: ", text);

	const label = event.target;
	const edit = event.target.parentElement.children[1];
	edit.value = label.innerText;
	label.style.display = 'none';
	edit.style.display = 'inline';
	edit.focus();
	edit.select();
}

const saveBoardEdit = function(element) {
	const edit = element;
	const label = element.parentElement.children[0];

	if(edit.value.trim() == "") edit.value = "[Enter title]";
	label.innerText = edit.value;
	label.style.display = 'inline';
	edit.style.display = 'none';

	sendApi('renameBoard', edit.value);
}

const placeList = function(name = "New List", id = "") {
	const boardBody = document.querySelector("#insertLists");
	if(boardBody == null) return false;

	boardBody.appendChild(createList(name, id));
	return true;
}

const placeTask = function(lid, name = "New Task", id = "", start = false, startDate = "", due = false, dueDate = "") {
	// Task selector: `.listBody > .task[data-taskid='${taskid}']`
	// List selector: `#insertLists > .list[data-listid='${listid}'] > .listBody`

	const list = document.querySelector(`#insertLists > .list[data-listid='${lid}'] > .listBody`);
	if(list == null) return false;

	const newTask = createTask(name, start, startDate, due, dueDate, id);
	list.appendChild(newTask);
	return true;
}

const getBoardStructure = function() {
	const lists = document.querySelector('.boardBody').children;
	console.log("Length of lists: ", lists.length);

	const structure = [];

	for(list of lists) {
		if(list.getAttribute('data-listid') == null) continue;

		const entry = {
			listid: list.getAttribute('data-listid'),
			tasks: []
		}

		const tasks = list.children[1].children;

		for(task of tasks) {
			entry.tasks.push(task.getAttribute('data-taskid'));
		}

		structure.push(entry);
	}

	console.log("STRUCTURE: " + JSON.stringify(structure));
	return structure;
}


const createList = function(name = "New List", id = "") {
	const listTemplate = document.getElementById("listTemplate");

	// Create list
	const newList = listTemplate.cloneNode(true);
	newList.removeAttribute("id");
	newList.removeAttribute("style");
	newList.className = "list";
	id = (id == "") ? listid++ : id;
	newList.setAttribute("data-listid", id);

	// Set up events for editing the list's name
	const listName = newList.children[0].children[0];
	listName.innerText = name;

	listName.addEventListener('click', editList);
	const editText = newList.children[0].children[1].children[0];

	editText.addEventListener("keyup", (event) => {
		if(event.key == "Enter" || event.key == "Escape") {
			saveListEdit(event.target);
		}
	});
	editText.addEventListener("blur", (event) => {
		saveListEdit(event.target);
	});


	// "Add Task" Button
	const addTaskButton = newList.children[2].children[0];
	addTaskButton.addEventListener('click', addTask);

	const deleteListButton = newList.children[2].children[1];
	deleteListButton.addEventListener("click", () => {
		deleteList(newList, id);
	})

	//TODO: Tell API that new list has been created

	return newList;
}

const deleteList = function(element, id) {
	if(!confirm("Are you sure you want to delete this list?")) return;

	element.remove();

	//TODO: Tell API that list was removed
	console.log("List ID " + id + " has been removed.");
}

const editList = function(event) {
	const text = event.target.innerText;
	console.log(text);

	const textDiv = event.target;
	const editDiv = event.target.parentElement.children[1];
	const editList = event.target.parentElement.children[1].children[0];
	editList.value = textDiv.innerText;
	textDiv.style.display = 'none';
	editDiv.style.display = 'inline';
	editList.focus();
	editList.select();
}

const saveListEdit = function(element) {
	const editText = element;
	const editDiv = element.parentElement;
	const textDiv = element.parentElement.parentElement.children[0];

	if(editText.value.trim() == "") editText.value = "[Enter title]";
	textDiv.innerText = editText.value;
	textDiv.style.display = 'inline';
	editDiv.style.display = 'none';

	//TODO: Tell API that list has been renamed
}


const addTask = function(event) {
	console.log("Add Task button pressed");
	const list = event.target.parentElement.parentElement.children[1];
	const newTask = createTask()
	list.appendChild(newTask);
	const taskName = newTask.children[0];
	taskName.dispatchEvent(new Event("click"));
}

const addList = function(event) {
	console.log("Add List button pressed");
	const boardBody = document.getElementById("insertLists");

	const newList = createList("New List");
	boardBody.appendChild(newList);
	setupSortables();
	const listName = newList.children[0].children[0];
	listName.dispatchEvent(new Event("click"));
}

const createTask = function(name = "New Task", start = false, startDate = "", due = false, dueDate = "", id = "") {
	const taskTemplate = document.getElementById("taskTemplate");
	const newTask = taskTemplate.cloneNode(true);
	newTask.removeAttribute("id");
	newTask.removeAttribute("style");
	newTask.className = "task";
	id = (id == "") ? taskid++ : id;
	newTask.setAttribute("data-taskid", id);

	// console.log("NEW TASK DATE STUFF")
	// console.log(newTask.children[2].children[0].children[0]);
	// console.log(newTask.children[2].children[0].children[2]);
	// console.log(newTask.children[2].children[1].children[0]);
	// console.log(newTask.children[2].children[1].children[2]);

	// Populate task
	const taskName = newTask.children[0];
	taskName.innerText = name;

	const nodeStartCheck = newTask.children[2].children[0].children[0];
	nodeStartCheck.checked = start;

	const nodeStartDate = newTask.children[2].children[0].children[2];
	nodeStartDate.value = startDate;
	nodeStartDate.addEventListener("change", () => updateTask(newTask));
	nodeStartCheck.addEventListener("change", () => checkCheck(nodeStartCheck, nodeStartDate));
	checkCheck(nodeStartCheck, nodeStartDate, true);

	const nodeDueCheck = newTask.children[2].children[1].children[0];
	nodeDueCheck.checked = due;

	const nodeDueDate = newTask.children[2].children[1].children[2];
	nodeDueDate.value = dueDate;
	nodeDueDate.addEventListener("change", () => updateTask(newTask));
	nodeDueCheck.addEventListener("change", () => checkCheck(nodeDueCheck, nodeDueDate));
	checkCheck(nodeDueCheck, nodeDueDate, true);

	// Set up events for editing the task's name
	taskName.addEventListener('click', editTask);
	const editText = newTask.children[1].children[0];

	editText.addEventListener("keyup", (event) => {
		if(event.key == "Enter" || event.key == "Escape") {
			saveTaskEdit(event.target);
		}
	});
	editText.addEventListener("blur", (event) => {
		saveTaskEdit(event.target);
	});

	const deleteButton = newTask.children[2].children[2];
	deleteButton.addEventListener("click", () => {
		deleteTask(newTask, id);
	});

	//TODO: Tell API that new task has been created

	return newTask;
}

const deleteTask = function(element, id) {
	element.remove();

	//TODO: Tell API that task was removed
	console.log("Task ID " + id + " has been removed.");
}

const checkCheck = function(check, date, initial = false) {
	if(check.checked) unGreyDate(date);
	else greyOutDate(date);

	if(!initial) {
		//TODO: Tell API about change
	}
}

const updateTask = function(element) {
	//TODO: Tell API that task has been updated
}

const greyOutDate = function(element) {
	element.classList.add("dateGreyed");
	element.setAttribute("readonly", "");
	element.setAttribute("disabled", "");
}

const unGreyDate = function(element) {
	element.classList.remove("dateGreyed");
	element.removeAttribute("readonly");
	element.removeAttribute("disabled");
}

var listid = 0;
var taskid = 0;

function editTask(event) {
	const text = event.target.innerText;
	console.log(text);

	const textDiv = event.target;
	const editDiv = event.target.parentElement.children[1];
	const editText = event.target.parentElement.children[1].children[0];
	console.log(editText);
	editText.value = textDiv.innerText;
	textDiv.style.display = 'none';
	editDiv.style.display = 'inline';
	editText.focus();
	editText.select();
}

const saveTaskEdit = function(element) {
	const editText = element;
	const editDiv = element.parentElement;
	const textDiv = element.parentElement.parentElement.children[0];

	if(editText.value.trim() == "") editText.value = "[Enter title]"
	textDiv.innerText = editText.value;
	textDiv.style.display = 'inline';
	editDiv.style.display = 'none';

	//TODO: Tell API that task has been edited
}

document.getElementById("addListButton").addEventListener("click", addList);
populateBoard();
boardNaming();
getBoard();

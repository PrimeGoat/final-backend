// API

/*\

GET /board - Gets entire layout
PUT /layout - Sends a bare (only IDs) layout.  This is sent whenever anything is moved around
PUT /updatetask - Edits a task
PUT /renameboard - Renames the board
PUT /renamelist/:listid - Renames a list
PUSH /newlist - Adds new list to end of lists
PUSH /newtask/:listid - Adds new task to end of a list
DELETE /deltask/:taskid - Deletes a task
DELETE /dellist/:listid - Deletes a list and all of its tasks

\*/


var kanbanBoard = {
	title: "TASX",
	lists: []
};

// Initial populate: Obtain entire dataset from API
const getBoard = function() {
	const request = new XMLHttpRequest();

	request.open('GET', 'http://localhost:3000/api/v1/board');

	request.onreadystatechange = () => {
		if(request.readyState === 4 && request.status === 200) {
			console.log("Incoming board: ", request.responseText);
			kanbanBoard = JSON.parse(request.responseText);
			clearBoard();
			populateBoard();
		}
	}

	request.send();
}

// Send API command: All API interaction done through here
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
		case 'renamelist':
			method = 'PUT';
			tail = `renamelist/${data[0]}`;
			body = {
				title: data[2]
			};
			data = `${data[1]} -> ${data[2]}`;
			break;
		case 'updatetask':
			method = 'PUT';
			tail = 'updatetask';
			if(getTaskById(data.taskid) == null) {
				console.log("Invalid updatetask task.");
				return null;
			}
			body = data;
			data = `Task ${data.taskid}`;
			break;
		case 'layout':
			method = 'PUT';
			tail = 'layout';
			console.log("Sending layout: ", data);
			body = data;
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
	console.log(`Sending API command: ${command} with data: ${data}`);
}

// Sets up jQuery's sortable feature to allow for rearranging of lists and tasks
const setupSortables = function() {
	$( () => {
		$( ".listBody" ).sortable({
			connectWith: ".connectedSorts",
			stop: () => {
				const layout = getBoardlayout();
				// Send the new layout to the API
				sendApi('layout', layout);
			}
		}).disableSelection();
	} );

	$( () => {
		$( ".boardBody" ).sortable({
			axis: 'x',
			stop: () => {
				const layout = getBoardlayout();
				// Send the new layout to the API
				sendApi('layout', layout);
			}
		}).disableSelection();
	} );
}

// Clears the board
const clearBoard = function() {
	//const lists = document.querySelector("#insertLists");
	const lists = document.children[0].children[1].children[2].children[0].children[1];

	//console.log(lists);
	while(lists.firstChild) lists.lastChild.remove();
}

// Populates the board, making it conform to the contents of the global kanbanBoard object
const populateBoard = function() {
	const boardTitle = document.getElementById("boardTitle");
	boardTitle.innerText = kanbanBoard.title;

	for(list of kanbanBoard.lists) {
		placeList(list.title, list.listid);

		for(task of list.tasks) {
			placeTask(list.listid, task.title, task.taskid, task.startDate != "", task.startDate, task.dueDate != "", task.dueDate);
		}
	}
	setupSortables();
}

// Sets up events to allow for the renaming of the board
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

// Event handler for board title editing: Entering editing mode
const editBoard = function(event) {
	const text = event.target.innerText;

	const label = event.target;
	const edit = event.target.parentElement.children[1];
	edit.value = label.innerText;
	label.style.display = 'none';
	edit.style.display = 'inline';
	edit.focus();
	edit.select();
}

// Exit board title editing mode and update label
const saveBoardEdit = function(element) {
	const edit = element;
	const label = element.parentElement.children[0];

	if(edit.value.trim() == "") edit.value = "[Enter title]";
	label.innerText = edit.value;
	label.style.display = 'inline';
	edit.style.display = 'none';

	if(edit.value != kanbanBoard.title) {
		// Value has changed.  Send it to API and update object
		kanbanBoard.title = edit.value;
		sendApi('renameBoard', edit.value);
	}
}

//  Places a new list onto the board
const placeList = function(name = "New List", id = "") {
	const boardBody = document.querySelector("#insertLists");
	if(boardBody == null) {
		console.log("Can't find board body");
		return false;
	}

	boardBody.appendChild(createList(name, id));
	return true;
}

// Places a new task into a specified list
const placeTask = function(lid, name = "New Task", id = "", start = false, startDate = "", due = false, dueDate = "") {
	// Task selector: `.listBody > .task[data-taskid='${taskid}']`
	// List selector: `#insertLists > .list[data-listid='${listid}'] > .listBody`

	const list = document.querySelector(`#insertLists > .list[data-listid='${lid}'] > .listBody`);
	if(list == null) return false;

	const newTask = createTask(name, start, startDate, due, dueDate, id);
	list.appendChild(newTask);
	return true;
}

// Returns the board layout
const getBoardlayout = function() {
	const lists = document.querySelector('.boardBody').children;
	const layout = [];

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

		layout.push(entry);
	}

	console.log("layout: " + JSON.stringify(layout));
	return layout;
}

// Creates a unique ID number
const makeId = function() {
	let id;

	do {
		id = Math.floor(Math.random() * (99999 - 11111) + 11111);
	} while(idExists(id));
	return id;
}

// Checks to see if ID number is already in use
const idExists = function(id) {
	for(list of kanbanBoard.lists) {
		if(list.listid == id) return true;
		for(task of list.tasks)
			if(task.taskid == id) return true;
	}
	return false;
}

// Creates a new list element
const createList = function(name = "New List", id = "") {
	const listTemplate = document.getElementById("listTemplate");

	// Create list
	const newList = listTemplate.cloneNode(true);
	newList.removeAttribute("id");
	newList.removeAttribute("style");
	newList.className = "list";
	id = (id === "") ? makeId() : id;
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

// Deletes a list
const deleteList = function(element, id) {
	if(!confirm("Are you sure you want to delete this list?")) return;

	element.remove();

	//TODO: Tell API that list was removed
	console.log("List ID " + id + " has been removed.");
}

// Event handler for list title editing: Entering editing mode
const editList = function(event) {
	const text = event.target.innerText;

	const textDiv = event.target;
	const editDiv = event.target.parentElement.children[1];
	const editList = event.target.parentElement.children[1].children[0];
	editList.value = textDiv.innerText;
	textDiv.style.display = 'none';
	editDiv.style.display = 'inline';
	editList.focus();
	editList.select();
}

// Exit list title editing mode and update label
const saveListEdit = function(element) {
	const editText = element;
	const editDiv = element.parentElement;
	const textDiv = element.parentElement.parentElement.children[0];
	editText.value = editText.value.trim();

	if(editText.value == "") editText.value = "[Enter title]";
	textDiv.innerText = editText.value;
	textDiv.style.display = 'inline';
	editDiv.style.display = 'none';

	const listId = element.parentElement.parentElement.parentElement.getAttribute('data-listid');
	const oldName = getListName(listId);
	if(editText.value != oldName) {
		// Value has changed.  Send it to API and update object.
		console.log("Value changed.");
		setListName(listId, editText.value);
		sendApi('renamelist', [listId, oldName, editText.value]);
	} else {
		console.log("Value did not change.");
	}
}

// Sets the name of the list with specified ID, or null if not found
const setListName = function(id, newName) {
	id = id.toString();

	for(let i = 0; i < kanbanBoard.lists.length; i++)
		if(kanbanBoard.lists[i].listid.toString() === id) {
			kanbanBoard.lists[i].title = newName;
			return true;
		}

	return null;
}

// Returns the name of the list with specified ID, or null if not found
const getListName = function(id) {
	id = id.toString();
	for(let list of kanbanBoard.lists)
		if(list.listid.toString() === id) return list.title;
	return null;
}

// Returns a task with specified ID, or null if not found
const getTaskById = function(id, index = false) {
	id = id.toString();
	for(let i = 0; i < kanbanBoard.lists.length; i++) {
		for(let j = 0; j < kanbanBoard.lists[i].tasks.length; j++) {
			if(kanbanBoard.lists[i].tasks[j].taskid.toString() === id) {
				if(index) return [i, j];
				else return kanbanBoard.lists[i].tasks[j];
			}
		}
	}
	return null;
}

// Event handler for "Add Task" button
const addTask = function(event) {
	const list = event.target.parentElement.parentElement.children[1];
	const newTask = createTask()
	list.appendChild(newTask);
	const taskName = newTask.children[0];
	taskName.dispatchEvent(new Event("click"));
}

// Event handler for "Add List" button
const addList = function(event) {
	const boardBody = document.getElementById("insertLists");

	const newList = createList("New List");
	boardBody.appendChild(newList);
	setupSortables();
	const listName = newList.children[0].children[0];
	listName.dispatchEvent(new Event("click"));
}

// Creates a task element
const createTask = function(name = "New Task", start = false, startDate = "", due = false, dueDate = "", id = "") {
	const taskTemplate = document.getElementById("taskTemplate");
	const newTask = taskTemplate.cloneNode(true);
	newTask.removeAttribute("id");
	newTask.removeAttribute("style");
	newTask.className = "task";
	id = (id === "") ? makeId() : id;
	newTask.setAttribute("data-taskid", id);

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

// Deletes a task
const deleteTask = function(element, id) {
	element.remove();

	//TODO: Tell API that task was removed
}

// Checks the status of a checkbox and takes appropriate measures
const checkCheck = function(check, date, initial = false) {
	if(check.checked) unGreyDate(date);
	else greyOutDate(date);

	if(!initial) {
		updateTask(date.parentElement.parentElement.parentElement);
	}
}

// Deals with changes to a task
const updateTask = function(element) {
	// Build a new task based on current element and compare with that of object in memory
	const taskId = element.getAttribute('data-taskid');
	const currentTaskIndex = getTaskById(taskId, true);
	const currentTask = kanbanBoard.lists[currentTaskIndex[0]].tasks[currentTaskIndex[1]];

	const DOMtask = {
		taskid: taskId,
		title: element.children[0].innerText,
		startDate: (element.children[2].children[0].children[0].checked) ?
			element.children[2].children[0].children[2].value : "",
		dueDate: (element.children[2].children[1].children[0].checked) ?
			element.children[2].children[1].children[2].value : "",
	};

	if(tasksDiffer(currentTask, DOMtask)) {
		// Task has changed.  Send it to API and update object
		console.log("Tasks differ");
		kanbanBoard.lists[currentTaskIndex[0]].tasks[currentTaskIndex[1]] = DOMtask;
		sendApi('updatetask', DOMtask);
	}

}

// Compares two tasks.  Used to check for changes in a task
const tasksDiffer = function(task1, task2) {
	if(task1.title !== task2.title) return true;
	if(task1.startDate !== task2.startDate) return true;
	if(task1.dueDate !== task2.dueDate) return true;

	return false;
}

// Greys out an unchecked date
const greyOutDate = function(element) {
	element.classList.add("dateGreyed");
	element.setAttribute("readonly", "");
	element.setAttribute("disabled", "");
}

// Reactivates a checked date
const unGreyDate = function(element) {
	element.classList.remove("dateGreyed");
	element.removeAttribute("readonly");
	element.removeAttribute("disabled");
}

// Event handler for task title editing:  Entering editing mode
function editTask(event) {
	const text = event.target.innerText;

	const textDiv = event.target;
	const editDiv = event.target.parentElement.children[1];
	const editText = event.target.parentElement.children[1].children[0];
	editText.value = textDiv.innerText;
	textDiv.style.display = 'none';
	editDiv.style.display = 'inline';
	editText.focus();
	editText.select();
}

// Exit task title editing mode and update label
const saveTaskEdit = function(element) {
	const editText = element;
	const editDiv = element.parentElement;
	const textDiv = element.parentElement.parentElement.children[0];

	if(editText.value.trim() == "") editText.value = "[Enter title]"
	textDiv.innerText = editText.value;
	textDiv.style.display = 'inline';
	editDiv.style.display = 'none';

	updateTask(element.parentElement.parentElement);
}

// Set up event handler for "Add List" button
document.getElementById("addListButton").addEventListener("click", addList);

// Populates the board, making it conform to the contents of the global kanbanBoard object (activation)
populateBoard();

// Sets up events to allow for the renaming of the board (activation)
boardNaming();

// Initial populate: Obtain entire dataset from API (activation)
getBoard();

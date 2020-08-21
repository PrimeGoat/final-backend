/*V*\
| X  \
| X |\\
| X | |>  Browser-side TASX MANAGER front-end code.
| X |//
| X  /      - Denis Savgir
\*A*/

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
			clearBoard();
			//kanbanBoard = JSON.parse(request.responseText);
			populateBoard(JSON.parse(request.responseText));
		}
	}

	request.send();
}

// Send API command: All API interaction done through here
const sendApi = function(command, data = "") {
	let tail, body;

	switch(command) {
		case 'renameBoard':	// Rename the board
			method = 'PUT';
			tail = 'renameboard';
			body = {
				title: data
			};
			break;
		case 'newlist':			// Add a new list
			method = 'POST';
			tail = 'newlist';
			body = data;
			data = `List ID ${data.listid}`;
			break;
		case 'renamelist':		// Rename a list
			method = 'PUT';
			tail = `renamelist/${data[0]}`;
			body = {
				title: data[2]
			};
			data = `${data[1]} -> ${data[2]}`;
			break;
		case 'dellist':			// Delete a list
			method = 'DELETE';
			tail = `dellist/${data[0]}`;
			data = `List ID ${data[0]}, List name ${data[1]}.`;
			break;
		case 'newtask':			// Create new task
			method = 'POST';
			tail = `newtask/${data[0]}`;
			body = data[1];
			data = `List ID ${data[0]}, Task ID ${data[1].taskid}`;
			break;
		case 'updatetask':		// Update a task
			method = 'PUT';
			tail = 'updatetask';
			if(getTaskById(data.taskid) == null) {
				console.log("Invalid updatetask task.");
				return null;
			}
			body = data;
			data = `Task ${data.taskid}`;
			break;
		case 'deltask':			// Delete a task
			method = 'DELETE';
			tail = `deltask/${data[0]}`;
			data = `Task ID ${data[0]}, Task name ${data[1]}.`;
			break;
		case 'layout':			// Update layout
			method = 'PUT';
			tail = 'layout';
			console.log("Sending layout: ", data);
			body = data;
			break;
		default:
			console.log("sendApi: Invalid command: " + command);
			return;
	}

	// Set up AJAX connection
	const request = new XMLHttpRequest();
	request.open(method, 'http://localhost:3000/api/v1/' + tail);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	request.onreadystatechange = () => {
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
	// Tasks
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

	// Lists (horizontal only)
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

	// Clear DB
	kanbanBoard = {
		title: "TASX",
		lists: []
	};

	// Clear DOM
	while(lists.firstChild) lists.lastChild.remove();
}

// Populates the board, making it conform to the contents of the specified kanbanboard object
const populateBoard = function(board) {
	console.log("Populate board: ", board);
	// Set board title
	kanbanBoard.title = board.title;
	const boardTitle = document.getElementById("boardTitle");
	boardTitle.innerText = kanbanBoard.title;

	// Parse the board object to build the working board
	for(list of board.lists) {
		placeList(list.title, list.listid, true);

		for(task of list.tasks) {
			placeTask(list.listid, task.title, task.taskid, task.startDate != "", task.startDate, task.dueDate != "", task.dueDate, true);
		}
	}
	setupSortables();
}

// Sets up events to allow for the renaming of the board
const boardNaming = function() {
	const boardTitle = document.getElementById("boardTitle");
	const boardTitleEdit = document.getElementById("boardEdit");

	// Start editing
	boardTitle.addEventListener('click', editBoard);

	// End editing
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
const placeList = function(name = "New List", id = "", dontSend = false) {
	const boardBody = document.querySelector("#insertLists");
	if(boardBody == null) {
		console.log("Can't find board body.");
		return false;
	}

	boardBody.appendChild(createList(name, id, dontSend));
	return true;
}

// Places a new task into a specified list
const placeTask = function(lid, name = "New Task", id = "", start = false, startDate = "", due = false, dueDate = "", dontSend = false) {
	// Task selector: `.listBody > .task[data-taskid='${taskid}']`
	// List selector: `#insertLists > .list[data-listid='${listid}'] > .listBody`

	// Find the list body of the list whose listid matches the specified listid
	const list = document.querySelector(`#insertLists > .list[data-listid='${lid}'] > .listBody`);
	if(list == null) return false;

	// Create a new task and append it to the list
	const newTask = createTask(name, start, startDate, due, dueDate, id);
	id = newTask.getAttribute('data-taskid');
	list.appendChild(newTask);

	// Create a new task object to add it to our board db
	const newTaskObj = {
		taskid: id,
		title: name,
		startDate: startDate,
		dueDate: dueDate
	}

	// Add the object to the db
	kanbanBoard.lists[getListName(lid, true)].tasks.push(newTaskObj);

	// Tell the API that we have a new task added
	if(!dontSend) sendApi('newtask', [lid, newTaskObj]);

	return newTask;
}

// Returns the board layout
const getBoardlayout = function() {
	const lists = document.querySelector('.boardBody').children;
	const layout = []; // Build a layout from scratch

	// Go through each list and find its tasks
	for(list of lists) {
		if(list.getAttribute('data-listid') == null) continue;

		// Build a list object
		const entry = {
			listid: list.getAttribute('data-listid'),
			tasks: []
		}

		const tasks = list.children[1].children;

		// Go through each task and add its taskid to the list object
		for(task of tasks) {
			entry.tasks.push(task.getAttribute('data-taskid'));
		}

		// Add the list object to the layout object
		layout.push(entry);
	}

	console.log("layout: " + JSON.stringify(layout));
	return layout;
}

// Creates a unique ID number
const makeId = function() {
	let id;

	do { // Keep generating random numbers until we find one that isn't in use (just in case)
		id = Math.floor(Math.random() * (99999 - 11111) + 11111);
	} while(((id) => {
		for(list of kanbanBoard.lists) {
			if(list.listid == id) return true;
			for(task of list.tasks)
				if(task.taskid == id) return true;
		}
		return false;
	})(id));
	return id;
}

// Creates a new list element
const createList = function(name = "New List", id = "", dontSend = false) {
	id = (id === "") ? makeId() : id;
	if(getListName(id) !== null) {
		// List with same ID already exists
		throw "Attempted to create a list with an ID that already exists: " + id;
	}

	// Use the template to create a new list
	const listTemplate = document.getElementById("listTemplate");

	// Create list
	const newList = listTemplate.cloneNode(true);
	newList.removeAttribute("id");
	newList.removeAttribute("style");
	newList.className = "list";
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

	// Delete List Button
	const deleteListButton = newList.children[2].children[1];
	deleteListButton.addEventListener("click", () => {
		deleteList(newList, id);
	})

	// Add list to db
	kanbanBoard.lists.push({
		listid: id,
		title: name,
		tasks: []
	});

	// Tell the API that we have a new list added
	if(!dontSend) sendApi('newlist', {listid: id, title: name, tasks: []});

	return newList;
}

// Deletes a list
const deleteList = function(element, id) {
	if(!confirm("Are you sure you want to delete this list?")) return;

	element.remove();

	const index = getListName(id, true);
	const name = getListName(id);

	kanbanBoard.lists.splice(index, 1);
	console.log(kanbanBoard.lists, index);

	console.log("List ID " + id + " has been removed.");

	sendApi('dellist', [id, name]);
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

	// Avoid blank titles
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
const getListName = function(id, index = false) {
	id = id.toString();
	for(let i = 0; i < kanbanBoard.lists.length; i++)
		if(kanbanBoard.lists[i].listid.toString() === id) {
			if(index) return i;
			else return kanbanBoard.lists[i].title;
		}
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
	const listId = event.target.parentElement.parentElement.getAttribute('data-listid');

	const newTask = placeTask(listId);
	//const newTask = createTask()
	//list.appendChild(newTask);

	newTask.children[0].dispatchEvent(new Event("click"));
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

	// Start Checkbox
	const nodeStartCheck = newTask.children[2].children[0].children[0];
	nodeStartCheck.checked = start;

	// Start Date
	const nodeStartDate = newTask.children[2].children[0].children[2];
	nodeStartDate.value = startDate;
	nodeStartDate.addEventListener("change", () => updateTask(newTask));
	nodeStartCheck.addEventListener("change", () => checkCheck(nodeStartCheck, nodeStartDate));
	checkCheck(nodeStartCheck, nodeStartDate, true);

	// Due Checkbox
	const nodeDueCheck = newTask.children[2].children[1].children[0];
	nodeDueCheck.checked = due;

	// Due Date
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

	return newTask;
}

// Deletes a task
const deleteTask = function(element, id) {
	element.remove();

	const indexes = getTaskById(id, true);
	const name = getTaskById(id).title;
	kanbanBoard.lists[indexes[0]].tasks.splice(indexes[1], 1);
	sendApi('deltask', [id, name]);
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

	// Build a task object based on the DOM task's properties
	const DOMtask = {
		taskid: taskId,
		title: element.children[0].innerText,
		startDate: (element.children[2].children[0].children[0].checked) ?
					element.children[2].children[0].children[2].value : "",
		dueDate:   (element.children[2].children[1].children[0].checked) ?
					element.children[2].children[1].children[2].value : "",
	};

	// Compare db and DOM
	if(currentTask.title			!== DOMtask.title
		|| currentTask.startDate	!== DOMtask.startDate
		|| currentTask.dueDate		!== DOMtask.dueDate) {
		// Task has changed.  Send it to API and update object
		console.log("Tasks differ");
		kanbanBoard.lists[currentTaskIndex[0]].tasks[currentTaskIndex[1]] = DOMtask;
		sendApi('updatetask', DOMtask);
	}
}

// Below function is no longer used, it was turned into a long if statement above.  Keeping it just in case.
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

	if(editText.value.trim() == "") editText.value = "[Enter title]";
	textDiv.innerText = editText.value;
	textDiv.style.display = 'inline';
	editDiv.style.display = 'none';

	updateTask(element.parentElement.parentElement);
}

// Set up event handler for "Add List" button
document.getElementById("addListButton").addEventListener("click", addList);

// Populates the board, making it conform to the contents of the global kanbanBoard object (activation)
populateBoard(kanbanBoard);

// Sets up events to allow for the renaming of the board (activation)
boardNaming();

// Initial populate: Obtain entire dataset from API (activation)
getBoard();

// API

// Task
const sampleTask = {
	taskId: 12345,
	title: "Sample Task",
	description: "Sample task template to describe the task structure",
	done: false,
	startDate: "",
	startTime: "",
	dueDate: "08-12-2020",
	dueTime: ""
}

// List
const sampleList = {
	ListId: 456,
	title: "Todo",
	tasks: [sampleTask]
}

// Board
const kanbanBoard = {
	title: "Task Manager",
	lists: [sampleList]
}


// Routes:

// GET /board
// GET /list/:id
// GET /task/:id
// POST
// PUT /updatetask/:id
// DELETE /killtask/:id

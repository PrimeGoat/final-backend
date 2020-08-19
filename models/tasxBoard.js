// Task
const sampleTask = {
	taskid: 12345,
	title: "Sample Task",
	startDate: "",
	dueDate: "2020-08-12"
}

// List
const sampleList = {
	listid: 456,
	title: "Todo",
	tasks: [sampleTask]
}

// Board
const sampleBoard = {
	title: "TASX",
	lists: [
		sampleList,
		{
			listid: 678,
			title: "Another List",
			tasks: [
				{
					taskid: 3523,
					title: "Denis' Birthday",
					startDate: "2020-06-07",
					dueDate: "2020-06-07"
				},
				{
					taskid: 3343,
					title: "More Taskageness",
					startDate: "",
					dueDate: "2020-04-20"
				}
			]
		}
	]
}

const kanbanBoard = {
	title: "TASX",
	lists: [
		{
			listid: 0,
			title: "Todo",
			tasks: [
				{
					taskid: 0,
					title: "Set up new todo list",
					startDate: "2020-08-19",
					dueDate: "2020-08-20"
				},
				{
					taskid: 1,
					title: "Create calendar",
					startDate: "",
					dueDate: "2020-08-22"
				}
			]
		},
		{
			listid: 1,
			title: "Doing",
			tasks: [
				{
					taskid: 2,
					title: "Create backend API",
					startDate: "2020-08-19",
					dueDate: ""
				}
			]
		},
		{
			listid: 2,
			title: "Done",
			tasks: []
		}
	]
}

console.log(kanbanBoard);


module.exports = {
	board: kanbanBoard
}
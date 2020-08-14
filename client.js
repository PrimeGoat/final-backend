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
	$( ".board" ).sortable({
		axis: 'x',
		change: () => {
			const structure = getBoardStructure();
			console.log("List has been moved.");
		}
	}).disableSelection();
} );


const getBoardStructure = function() {
	const lists = document.querySelector('.board').children;
	console.log("Length of lists: ", lists.length);
	for(list of lists) {
		if(list.getAttribute('data-listId') == null) continue;

		console.log("List ", list.getAttribute('data-listId') + ':');
		const tasks = list.children[1].children;

		for(task of tasks) {
			console.log(task.getAttribute('data-taskId'));
		}
	}
}

var taskId = 100;

const addTask = function(event) {
	console.log("Button pressed.");
	const listId = event.target.parentElement.parentElement.getAttribute('data-listId');
	const newTask = document.createElement('div');
	newTask.className = "task";
	newTask.setAttribute("data-taskId", taskId++);
	newTask.innerText = "Task";
	event.target.parentElement.parentElement.children[1].appendChild(newTask);

	console.log(listId);
}

/*
$( function() {
	$( "#sortList1, #sortList2, #sortList3" ).sortable({
		connectWith: ".connectedSorts"
	}).disableSelection();
} );
*/

document.querySelector('button').addEventListener('click', addTask);

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const taskInput = document.getElementById('taskInput');
    const taskDateInput = document.getElementById('taskDateInput');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // --- NEW: Selectors for new UI features ---
    const greetingText = document.getElementById('greetingText');
    const quoteDisplay = document.getElementById('quoteDisplay');
    const usernameSpan = document.getElementById('username');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // --- Initial Render ---
    // --- NEW: Call functions to set up the new UI features on load ---
    setGreeting();
    displayRandomQuote();
    loadUsername();
    renderTasks();

    // --- Event Listeners ---
    addTaskForm.addEventListener('submit', e => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const date = taskDateInput.value;
        if (text) {
            tasks.push({ text, date, completed: false, id: Date.now() });
            saveAndRender();
            taskInput.value = '';
            taskDateInput.value = '';
        }
    });

    taskList.addEventListener('click', e => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;
        const taskId = Number(taskItem.dataset.id);

        if (target.closest('.complete-checkbox')) {
            toggleTaskCompletion(taskId);
        } else if (target.closest('.edit-btn')) {
            editTask(taskItem, taskId);
        } else if (target.closest('.delete-btn')) {
            deleteTask(taskId);
        }
    });
    
    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveAndRender();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });

    // --- NEW: Event listener for editing the username ---
    usernameSpan.addEventListener('click', () => {
        const currentName = usernameSpan.textContent === "Your" ? "" : usernameSpan.textContent;
        const newName = prompt("What's your name?", currentName);
        if (newName && newName.trim() !== '') {
            localStorage.setItem('username', newName.trim());
            loadUsername();
        }
    });

    // --- Core Functions ---
    function saveAndRender() {
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
        updateTaskCount();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const isOverdue = task.date && new Date(task.date) < new Date().setHours(0,0,0,0);
        
        li.innerHTML = `
            <div class="complete-checkbox" role="button" aria-pressed="${task.completed}">
                <svg viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>
            </div>
            <div class="task-details">
                <span class="task-text">${task.text}</span>
                ${task.date ? `<span class="task-date ${isOverdue && !task.completed ? 'overdue' : ''}">${formatDate(task.date)}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" aria-label="Edit task">
                    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                </button>
                <button class="action-btn delete-btn" aria-label="Delete task">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                </button>
            </div>
        `;
        return li;
    }
    
    function toggleTaskCompletion(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveAndRender();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    }
    
    function editTask(taskItem, id) {
        const taskDetails = taskItem.querySelector('.task-details');
        const taskTextSpan = taskItem.querySelector('.task-text');
        const originalText = taskTextSpan.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;
        taskDetails.replaceChild(input, taskTextSpan);
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                const task = tasks.find(t => t.id === id);
                if (task) {
                    task.text = newText;
                    saveAndRender();
                }
            } else {
                taskDetails.replaceChild(taskTextSpan, input);
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                taskDetails.replaceChild(taskTextSpan, input);
            }
        });
    }

    function updateTaskCount() {
        const remainingTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${remainingTasks} task${remainingTasks !== 1 ? 's' : ''} left`;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, options);
    }

    // --- NEW: UI Feature Functions ---

    function setGreeting() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) {
            greeting = "Good morning,";
        } else if (hour < 18) {
            greeting = "Good afternoon,";
        } else {
            greeting = "Good evening,";
        }
        greetingText.textContent = greeting;
    }

    function displayRandomQuote() {
        const quotes = [
            "The secret of getting ahead is getting started.",
            "The best way to predict the future is to create it.",
            "Don’t watch the clock; do what it does. Keep going.",
            "Well done is better than well said.",
            "The only way to do great work is to love what you do.",
            "Act as if what you do makes a difference. It does."
        ];
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteDisplay.textContent = `"${quotes[randomIndex]}"`;
    }

    function loadUsername() {
        const savedName = localStorage.getItem('username');
        if (savedName) {
            usernameSpan.textContent = savedName + "'s";
        } else {
            usernameSpan.textContent = 'Your';
        }
    }
});

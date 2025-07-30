let tasks = [];
let showAllCompleted = false;
const VISIBLE_HISTORY_COUNT = 10;
const STORAGE_KEY_TASKS = 'priorityCompassPRO_tasks_v-master';
const STORAGE_KEY_NOTES = 'priorityCompassPRO_notes_v-master';

const quadrantData = {
    'do-now': { title: '🔥 Urobiť Hneď', container: 'do-now-quadrant', color: 'red' },
    'plan': { title: '📅 Naplánovať', container: 'plan-quadrant', color: 'blue' },
    'delegate': { title: '➡️ Delegovať', container: 'delegate-quadrant', color: 'orange' },
    'eliminate': { title: '🗑️ Eliminovať', container: 'eliminate-quadrant', color: 'gray' }
};

const categorySynonyms = {
    'urobiť hneď': 'do-now', 'urobit hned': 'do-now', 'do now': 'do-now', 'hned': 'do-now',
    'naplánovať': 'plan', 'naplanovat': 'plan', 'plan': 'plan',
    'delegovať': 'delegate', 'delegovat': 'delegate', 'delegate': 'delegate',
    'eliminovať': 'eliminate', 'eliminovat': 'eliminate', 'eliminate': 'eliminate', 'zrusit': 'eliminate'
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
        closeAllMenus();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch(e) {
            console.error("Error parsing tasks from localStorage", e);
            tasks = [];
        }
    }
    const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
    if (savedNotes) {
        document.getElementById('notes-scratchpad').value = savedNotes;
    }
    renderQuadrants();
    renderAll();
});

function saveStateAndRender() {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    renderAll();
}

function saveNotes() {
    const notesValue = document.getElementById('notes-scratchpad').value;
    localStorage.setItem(STORAGE_KEY_NOTES, notesValue);
}

function getCategoryKey(userInput) {
    return categorySynonyms[userInput.trim().toLowerCase()] || null;
}

function addTasksFromInput() {
    const input = document.getElementById('taskInput');
    const lines = input.value.split('\n').filter(line => line.trim() !== '');
    let tasksAdded = 0;
    lines.forEach((line) => {
        const parts = line.split('|');
        if (parts.length === 2) {
            const taskText = parts[0].trim();
            const categoryKey = getCategoryKey(parts[1]);
            if(taskText && categoryKey) {
                addTask(taskText, categoryKey);
                tasksAdded++;
            }
        }
    });

    if (tasksAdded > 0) {
        input.value = '';
    } else {
        alert("Nenašli sa žiadne platné úlohy. Použite formát: 'Text úlohy | Kategória'.\n\nPlatné kategórie sú: Urobiť Hneď, Naplánovať, Delegovať, Eliminovať.");
    }
}

function addTask(text, category, isDone = false) {
     if (!text || !category || !quadrantData[category]) return;
     
     tasks.push({
        id: Date.now() + Math.random(),
        text: text,
        category: category,
        done: isDone,
        completionDate: isDone ? new Date().toISOString() : null
     });
     
     saveStateAndRender();
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.done = !task.done;
        task.completionDate = task.done ? new Date().toISOString() : null;
    }
    saveStateAndRender();
}

function changeTaskCategory(taskId, newCategory) {
    const task = tasks.find(t => t.id === taskId);
    if(task && quadrantData[newCategory]) {
        task.category = newCategory;
    }
    saveStateAndRender();
}

function deleteTask(taskId) {
    const taskText = tasks.find(t => t.id === taskId)?.text || '';
    if (confirm(`Naozaj chcete natrvalo vymazať túto úlohu?\n\n"${taskText}"`)) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveStateAndRender();
    }
}

function editTask(taskId) {
    closeAllMenus();
    const taskElement = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
    const labelContainer = taskElement.querySelector('.label-container');
    const taskTextElement = labelContainer.querySelector('.task-text');
    const currentText = tasks.find(t => t.id === taskId).text;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'w-full p-1 -m-1 rounded border border-indigo-500 bg-white';

    const saveChanges = () => {
        const newText = input.value.trim();
        if (newText) {
            tasks.find(t => t.id === taskId).text = newText;
        }
        saveStateAndRender();
    };
    
    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            renderAll();
        }
    });
    
    labelContainer.replaceChild(input, taskTextElement);
    input.focus();
    input.select();
}

function closeAllMenus() {
    document.querySelectorAll('.category-menu').forEach(menu => {
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    });
}

function toggleCategoryMenu(taskId, event) {
    event.stopPropagation();
    const currentMenu = document.getElementById(`menu-${taskId}`);
    const isHidden = currentMenu.classList.contains('hidden');
    
    closeAllMenus();
    
    if(isHidden) {
        currentMenu.classList.remove('hidden');
    }
}

function handleManualAdd(category) {
    const input = document.getElementById(`add-input-${category}`);
    if (input.value.trim()) {
        addTask(input.value.trim(), category);
        input.value = '';
    }
}

function renderQuadrants() {
    Object.keys(quadrantData).forEach(key => {
        const q = quadrantData[key];
        const quadrantEl = document.getElementById(q.container);
        quadrantEl.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">${q.title}</h2>
            </div>
            <div class="mb-3 gap-2 flex">
                <input type="text" id="add-input-${key}" class="flex-grow p-2 border rounded-md" placeholder="Nová rýchla úloha..." onkeydown="if(event.key==='Enter')handleManualAdd('${key}')">
                <button onclick="handleManualAdd('${key}')" class="bg-indigo-500 text-white px-3 py-2 rounded-md hover:bg-indigo-600 font-semibold">+</button>
            </div>
            <div id="${key}" class="space-y-3"></div>`;
    });
}

function renderAll() {
    closeAllMenus();
    const historyContainer = document.getElementById('history');
    const historyControls = document.getElementById('history-controls');
    historyContainer.innerHTML = '';
    historyControls.innerHTML = '';

    Object.keys(quadrantData).forEach(key => {
        const quadrantContent = document.getElementById(key);
        if (quadrantContent) quadrantContent.innerHTML = '';
    });
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const activeTasks = tasks.filter(t => !t.done).sort((a,b) => b.id - a.id);
    const completedTasks = tasks.filter(t => t.done && t.text.toLowerCase().includes(searchTerm))
                                .sort((a,b) => new Date(b.completionDate) - new Date(a.completionDate));
    
    activeTasks.forEach(task => renderSingleTask(task));

    const tasksToDisplay = showAllCompleted ? completedTasks : completedTasks.slice(0, VISIBLE_HISTORY_COUNT);
    tasksToDisplay.forEach(task => renderSingleTask(task));

    if (completedTasks.length > VISIBLE_HISTORY_COUNT) {
        const buttonText = showAllCompleted ? 'Skryť staršie úlohy' : `Zobraziť všetky (${completedTasks.length})`;
        historyControls.innerHTML = `<button onclick="toggleShowAll()" class="text-indigo-600 hover:text-indigo-800 font-semibold">${buttonText}</button>`;
    }
}

function toggleShowAll() {
    showAllCompleted = !showAllCompleted;
    renderAll();
}

function renderSingleTask(task) {
    const container = task.done ? document.getElementById('history') : document.getElementById(task.category);
    if (!container) return;

    const taskElement = document.createElement('div');
    taskElement.className = `task-card bg-white p-3 rounded-lg shadow-sm flex items-center border-${quadrantData[task.category]?.color}-500 ${task.done ? 'task-card-done' : ''}`;
    taskElement.setAttribute('data-task-id', task.id);
    
    const dateInfo = (task.done && task.completionDate) ? `<span class="text-xs text-gray-400 flex-shrink-0">${new Date(task.completionDate).toLocaleDateString('sk-SK')}</span>` : '';

    let controls = '';
    if(!task.done) {
         controls = `
            <div class="relative ml-auto pl-2 flex-shrink-0">
                <button onclick="toggleCategoryMenu(${task.id}, event)" class="p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                </button>
                <div id="menu-${task.id}" class="category-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 border border-gray-200">
                    <a href="#" onclick="event.preventDefault(); editTask(${task.id})" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Upraviť text</a>
                    ${Object.keys(quadrantData).filter(k => k !== task.category).map(k => `<a href="#" onclick="event.preventDefault(); changeTaskCategory(${task.id}, '${k}')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Presunúť: ${quadrantData[k].title.split(' ')[1]}</a>`).join('')}
                    <div class="my-1 border-t border-gray-100"></div>
                    <a href="#" onclick="event.preventDefault(); deleteTask(${task.id})" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Vymazať úlohu</a>
                </div>
            </div>`;
    } else {
        controls = `
            <div class="ml-auto pl-4 flex items-center gap-x-3 flex-shrink-0">
                ${dateInfo}
                <button onclick="deleteTask(${task.id})" class="p-1 rounded-full hover:bg-gray-300 transition-colors" title="Natrvalo vymazať úlohu">
                    <svg class="w-5 h-5 text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>`;
    }

    taskElement.innerHTML = `
        <div class="flex-shrink-0">
            <input type="checkbox" id="task-${task.id}" class="h-5 w-5 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" ${task.done?'checked':''} onchange="toggleTask(${task.id})">
        </div>
        <div class="flex-grow mx-4 label-container">
            <label for="task-${task.id}" class="task-text text-gray-800 font-medium cursor-pointer">${task.text}</label>
        </div>
        ${controls}`;
        
    container.appendChild(taskElement);
}

function exportForPrint() {
    const printWindow = window.open('', '_blank');
    const tasksToPrint = tasks.filter(t => !t.done);

    let content = '';
    content += '<!DOCTYPE html>';
    content += '<html lang="sk">';
    content += '<head><title>Kompas priorít - Tlač úloh</title>';
    content += '<style>';
    content += 'body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 2em; }';
    content += 'h1, h2 { border-bottom: 2px solid #eee; padding-bottom: 10px; }';
    content += 'ul { list-style-type: none; padding-left: 0; }';
    content += 'li { border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-left-width: 5px; }';
    content += '@media print { button { display: none; } }';
    content += '</style>';
    content += '</head><body>';
    content += '<button onclick="window.print()">Tlačiť</button>';
    content += '<h1>Aktuálne úlohy (' + new Date().toLocaleDateString('sk-SK') + ')</h1>';
    
    Object.keys(quadrantData).forEach(key => {
        const quadrantTasks = tasksToPrint.filter(t => t.category === key);
        if(quadrantTasks.length > 0) {
            content += '<h2>' + quadrantData[key].title + '</h2><ul>';
            quadrantTasks.forEach(t => {
                content += '<li style="border-left-color:' + quadrantData[key].color + ';">' + t.text + '</li>';
            });
            content += '</ul>';
        }
    });

    content += '</body></html>';
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
}

function exportJSON() {
    const dataToExport = {
        tasks: tasks,
        notes: document.getElementById('notes-scratchpad').value
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `kompas-priorit-zaloha-${new Date().toISOString().slice(0, 10)}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data.tasks) && typeof data.notes !== 'undefined') {
                if (confirm("Naozaj chcete nahradiť všetky aktuálne úlohy a poznámky dátami zo súboru? Táto akcia je nezvratná.")) {
                    tasks = data.tasks;
                    document.getElementById('notes-scratchpad').value = data.notes;
                    saveStateAndRender();
                    saveNotes();
                    alert("Dáta boli úspešne importované.");
                }
            } else {
                alert("Chyba: Súbor nemá správnu štruktúru. Očakáva sa objekt s kľúčmi 'tasks' a 'notes'.");
            }
        } catch(error) { 
            alert("Chyba pri spracovaní súboru. Uistite sa, že je to platný JSON súbor vygenerovaný touto aplikáciou."); 
            console.error("JSON Import Error:", error);
        } finally { 
            event.target.value = null; 
        }
    };
    reader.readAsText(file);
}

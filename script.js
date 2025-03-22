let processes = [];
let timeline = [];

function addProcess() {
    const pid = document.getElementById('pid').value;
    const arrival = parseInt(document.getElementById('arrival').value);
    const burst = parseInt(document.getElementById('burst').value);
    const priority = parseInt(document.getElementById('priority').value) || 0;

    if (!pid || isNaN(arrival) || isNaN(burst)) {
        alert('Please fill all fields correctly');
        return;
    }

    if (processes.some(p => p.pid === pid)) {
        alert('Process ID must be unique');
        return;
    }

    processes.push({
        pid,
        arrival,
        burst,
        priority,
        remaining: burst
    });

    updateProcessTable();
    clearInputs();
}

function clearInputs() {
    document.getElementById('pid').value = '';
    document.getElementById('arrival').value = '';
    document.getElementById('burst').value = '';
    document.getElementById('priority').value = '';
}

function generateRandom(includePriority = true) {
    const count = Math.floor(Math.random() * 3) + 3; 
    processes = [];

    for (let i = 0; i < count; i++) {
        processes.push({
            pid: `P${i + 1}`,
            arrival: Math.floor(Math.random() * 5),
            burst: Math.floor(Math.random() * 8) + 1,
            priority: includePriority ? Math.floor(Math.random() * 5) : 0, 
            remaining: 0
        });
    }

    updateProcessTable();
}

function generateFromUI() {
    const includePriority = document.getElementById("priorityToggle").checked;
    generateRandom(includePriority);
}

function updateProcessTable() {
    const table = document.createElement('table');
    table.className = 'results-table';
    
    const header = table.createTHead();
    const headerRow = header.insertRow();
    ['Process', 'Arrival Time', 'Burst Time', 'Priority', 'Action']
        .forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

    const tbody = table.createTBody();
    processes.forEach((process, index) => {
        const row = tbody.insertRow();
        [process.pid, process.arrival, process.burst, process.priority]
            .forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });
        
        const actionCell = row.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
            processes.splice(index, 1);
            updateProcessTable();
        };
        actionCell.appendChild(deleteButton);
    });

    const processTable = document.getElementById('processTable');
    processTable.innerHTML = '';
    processTable.appendChild(table);
}

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



function algorithmChanged() {
    const algorithm = document.getElementById('algorithm').value;
    const timeQuantumDiv = document.getElementById('timeQuantumDiv');
    const selectedAlgorithm = document.getElementById('selectedAlgorithm');
    
    timeQuantumDiv.style.display = algorithm === 'rr' ? 'block' : 'none';
    selectedAlgorithm.style.display = 'none';
}

function runSimulation() {
    if (processes.length === 0) {
        alert('Please add at least one process');
        return;
    }

    const algorithm = document.getElementById('algorithm').value;
    const quantum = parseInt(document.getElementById('quantum').value);

    processes.forEach(p => {
        p.remaining = p.burst;
    });
    timeline = [];

    switch(algorithm) {
        case 'fcfs':
            simulateFCFS();
            break;
        case 'sjf':
            simulateSJF(false);
            break;
        case 'sjf_preemptive':
            simulateSJF(true);
            break;
        case 'priority_preemptive':
            simulatePriority(true);
            break;
        case 'rr':
            simulateRR(quantum);
            break;
        case 'auto':
            selectBestAlgorithm();
            break;
    }

    updateGanttChart();
    calculateMetrics();
    updateResultsTable();
}

function simulateFCFS() {
    const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;

    sorted.forEach(process => {
        if (currentTime < process.arrival) {
            currentTime = process.arrival;
        }
        
        timeline.push({
            pid: process.pid,
            start: currentTime,
            end: currentTime + process.burst
        });
        
        currentTime += process.burst;
    });
}

function simulateSJF(preemptive) {
    
    const processQueue = processes.map(p => ({...p}));
    let currentTime = 0;
    let completed = 0;
    let currentProcess = null;
    let lastProcess = null;
    
    const earliestArrival = Math.min(...processQueue.map(p => p.arrival));
    currentTime = earliestArrival;
    
    if (!preemptive) {
        // Sort by arrival time initially
        const sortedByArrival = [...processQueue].sort((a, b) => a.arrival - b.arrival);
        
        while (completed < processQueue.length) {
            const available = processQueue
                .filter(p => p.remaining > 0 && p.arrival <= currentTime)
                .sort((a, b) => a.burst - b.burst); // Sort by burst time for SJF
            
            if (available.length === 0) {
                const nextArrival = processQueue
                    .filter(p => p.remaining > 0 && p.arrival > currentTime)
                    .sort((a, b) => a.arrival - b.arrival)[0];
                
                if (nextArrival) {
                    currentTime = nextArrival.arrival;
                } else {
                    currentTime++;
                }
                continue;
            }
            
            currentProcess = available[0];
            
            timeline.push({
                pid: currentProcess.pid,
                start: currentTime,
                end: currentTime + currentProcess.remaining
            });
            
            currentTime += currentProcess.remaining;
            currentProcess.remaining = 0;
            completed++;
        }
    } 
    else {
        let lastPid = null;
        let lastStartTime = null;
        
        while (completed < processQueue.length) {
            const available = processQueue
                .filter(p => p.remaining > 0 && p.arrival <= currentTime)
                .sort((a, b) => a.remaining - b.remaining); // Sort by remaining time for SRTF
            
            if (available.length === 0) {
                const nextArrival = processQueue
                    .filter(p => p.remaining > 0 && p.arrival > currentTime)
                    .sort((a, b) => a.arrival - b.arrival)[0];
                
                if (nextArrival) {
                    currentTime = nextArrival.arrival;
                } else {
                    currentTime++;
                }
                continue;
            }
            currentProcess = available[0];
            if (lastPid !== currentProcess.pid && lastPid !== null) {
                timeline.push({
                    pid: lastPid,
                    start: lastStartTime,
                    end: currentTime
                });
                lastStartTime = currentTime;
            } else if (lastPid === null) {
                lastStartTime = currentTime;
            }
            
            lastPid = currentProcess.pid;
            let nextEventTime = Infinity;
            const nextArrival = processQueue
                .filter(p => p.remaining > 0 && p.arrival > currentTime)
                .sort((a, b) => a.arrival - b.arrival)[0];
            
            if (nextArrival) {
                nextEventTime = nextArrival.arrival;
            }
            const completionTime = currentTime + currentProcess.remaining;
            if (completionTime < nextEventTime) {
                nextEventTime = completionTime;
            }
            const timeSpent = nextEventTime - currentTime;
            currentProcess.remaining -= timeSpent;

            if (currentProcess.remaining <= 0) {
                completed++;
                timeline.push({
                    pid: currentProcess.pid,
                    start: lastStartTime,
                    end: nextEventTime
                });
                
                lastPid = null; // Reset for next process
            }
            
            currentTime = nextEventTime;
        }
    }
}

function simulatePriority(preemptive) {
    let currentTime = 0;
    let completed = 0;
    let currentProcess = null;
    const processQueue = [...processes];

    while (completed < processes.length) {
        const available = processQueue
            .filter(p => p.remaining > 0 && p.arrival <= currentTime)
            .sort((a, b) => b.priority - a.priority); 

        if (available.length === 0) {
            currentTime++;
            continue;
        }

        currentProcess = available[0];
        timeline.push({
            pid: currentProcess.pid,
            start: currentTime,
            end: currentTime + 1
        });
        currentProcess.remaining--;
        
        if (currentProcess.remaining === 0) {
            completed++;
        }
        
        currentTime++;
    }
}

function simulateRR(quantum) {
    let currentTime = 0;
    let completed = 0;
    const processQueue = [...processes];
    
    while (completed < processes.length) {
        const available = processQueue
            .filter(p => p.remaining > 0 && p.arrival <= currentTime);

        if (available.length === 0) {
            currentTime++;
            continue;
        }

        const process = available[0];
        const executeTime = Math.min(quantum, process.remaining);

        timeline.push({
            pid: process.pid,
            start: currentTime,
            end: currentTime + executeTime
        });

        process.remaining -= executeTime;
        currentTime += executeTime;

        if (process.remaining > 0) {
            const proc = processQueue.shift();
            processQueue.push(proc);
        } else {
            completed++;
            processQueue.shift();
        }
    }
}

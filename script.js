let processes = [];
let timeline = [];

function addProcess() {
    const pid = document.getElementById('pid').value.trim();
    const arrival = +document.getElementById('arrival').value;
    const burst = +document.getElementById('burst').value;
    const priority = +document.getElementById('priority').value || 0;
    if (!pid || isNaN(arrival) || isNaN(burst)) return alert('Enter valid details!');
    if (processes.some(p => p.pid === pid)) return alert('Process ID must be unique!');
    processes.push({ pid, arrival, burst, priority, remaining: burst });
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
    const processTable = document.getElementById('processTable');
    processTable.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Process</th>
                <th>Arrival Time</th>
                <th>Burst Time</th>
                <th>Priority</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            ${processes.map((p, i) => `
                <tr>
                    <td>${p.pid}</td>
                    <td>${p.arrival}</td>
                    <td>${p.burst}</td>
                    <td>${p.priority}</td>
                    <td><button onclick="deleteProcess(${i})">Delete</button></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    processTable.appendChild(table);
}
function deleteProcess(index) {
    processes.splice(index, 1);
    updateProcessTable();
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
        const sortedByArrival = [...processQueue].sort((a, b) => a.arrival - b.arrival);
        while (completed < processQueue.length) {
            const available = processQueue
                .filter(p => p.remaining > 0 && p.arrival <= currentTime)
                .sort((a, b) => a.burst - b.burst);            
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
                .sort((a, b) => a.remaining - b.remaining); 
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
                lastPid = null; 
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
function selectBestAlgorithm() {
    compareAlgorithms();
}
function compareAlgorithms() {
    const originalProcesses = [...processes];
    const algorithms = [
        { name: 'FCFS', func: simulateFCFS },
        { name: 'SJF (Non-preemptive)', func: () => simulateSJF(false) },
        { name: 'SRTF', func: () => simulateSJF(true) },
        { name: 'Priority (Preemptive)', func: () => simulatePriority(true) },
        { name: 'Round Robin', func: () => simulateRR(2) }
    ];
    const results = algorithms.map(({ name, func }) => {
        processes = originalProcesses.map(p => ({ ...p, remaining: p.burst }));
        timeline = [];
        func();
        let totalWaitingTime = 0, totalTurnaroundTime = 0;
        processes.forEach(p => {
            const completion = Math.max(...timeline.filter(t => t.pid === p.pid).map(t => t.end), 0);
            const turnaround = completion - p.arrival, waiting = turnaround - p.burst;
            totalWaitingTime += waiting;
            totalTurnaroundTime += turnaround;
        });
        return {
            algorithm: name,
            avgWaiting: (totalWaitingTime / processes.length).toFixed(2),
            avgTurnaround: (totalTurnaroundTime / processes.length).toFixed(2)
        };
    });
    processes = originalProcesses;
    const bestAlgorithm = results.reduce((best, curr) => 
        (parseFloat(curr.avgWaiting) + parseFloat(curr.avgTurnaround) < parseFloat(best.avgWaiting) + parseFloat(best.avgTurnaround) ? curr : best)
    );
    timeline = [];
    algorithms.find(a => a.name === bestAlgorithm.algorithm).func();
    updateGanttChart();
    const sortedResults = results.sort((a, b) =>
        (parseFloat(a.avgWaiting) + parseFloat(a.avgTurnaround)) - (parseFloat(b.avgWaiting) + parseFloat(b.avgTurnaround))
    );
    document.getElementById('selectedAlgorithm').innerHTML = `
        <div class="algorithm-comparison">
            <h3>AI Optimization</h3>
            <p>Recommended Algorithm: ${bestAlgorithm.algorithm}</p>
            <p class="recommendation-details">Best overall performance based on both Average Waiting Time and Average Turnaround Time</p>
            <h3>Algorithm Comparison:</h3>
            <table class="comparison-table">
                <tr><th>Algorithm</th><th>Avg Waiting Time</th><th>Avg Turnaround Time</th></tr>
                ${sortedResults.map(({ algorithm, avgWaiting, avgTurnaround }) => 
                    `<tr><td>${algorithm}</td><td>${avgWaiting} ms</td><td>${avgTurnaround} ms</td></tr>`
                ).join('')}
            </table>
        </div>
    `;
    document.getElementById('selectedAlgorithm').style.display = 'block';
    calculateMetrics();
    updateResultsTable();
}
function updateGanttChart() {
    const chart = document.getElementById('ganttChart');
    const width = chart.clientWidth || chart.offsetWidth || 800, height = 150;
    if (!timeline.length) return (chart.innerHTML = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`);
    const endTime = Math.max(...timeline.map(t => t.end));
    const colors = { P1: '#4CAF50', P2: '#2196F3', P3: '#FFC107', P4: '#9C27B0', P5: '#F44336' };

    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.3)" />
                <stop offset="100%" style="stop-color:rgba(0,0,0,0.2)" />
            </linearGradient>
        </defs>`;

    svg += `<line x1="0" y1="100" x2="${width}" y2="100" stroke="#666" stroke-width="2"/>`;
    for (let t = 0; t <= endTime; t++) {
        const x = (t / endTime) * width;
        svg += `
            <line x1="${x}" y1="20" x2="${x}" y2="100" stroke="#e5e5e5" stroke-width="1"/>
            <line x1="${x}" y1="95" x2="${x}" y2="105" stroke="#666" stroke-width="2"/>
            <text x="${x}" y="125" text-anchor="middle" fill="#666" font-size="12" font-weight="bold">${t}</text>
        `;
    }

    timeline.forEach(({ start, end, pid }) => {
        const x = (start / endTime) * width;
        const w = ((end - start) / endTime) * width;
        const color = colors[pid] || '#1f77b4';

        svg += `
            <g class="process-group">
                <!-- Base shadow -->
                <rect x="${x}" y="22" width="0" height="76" 
                      fill="rgba(0,0,0,0.2)" rx="4">
                    <animate attributeName="width" from="0" to="${w}" 
                            dur="0.3s" fill="freeze"/>
                </rect>
                <!-- Main bar -->
                <rect x="${x}" y="20" width="0" height="80" 
                      fill="${color}" rx="4">
                    <animate attributeName="width" from="0" to="${w}" 
                            dur="0.3s" fill="freeze"/>
                </rect>
                <!-- 3D effect overlay -->
                <rect x="${x}" y="20" width="0" height="80" 
                      fill="url(#barGradient)" rx="4" 
                      style="pointer-events: none">
                    <animate attributeName="width" from="0" to="${w}" 
                            dur="0.3s" fill="freeze"/>
                </rect>
                <text x="${x + w/2}" y="65" text-anchor="middle" 
                      fill="white" font-weight="bold" opacity="0">
                    ${pid}
                    <animate attributeName="opacity" from="0" to="1" 
                            dur="0.3s" fill="freeze"/>
                </text>
            </g>
        `;
    });

    chart.innerHTML = svg + '</svg>';
}
function calculateMetrics() {
    const n = processes.length;
    const makespan = Math.max(...timeline.map(t => t.end));
    const totalBurstTime = processes.reduce((sum, p) => sum + p.burst, 0);    
    let totalWaiting = 0, totalTurnaround = 0, totalResponse = 0;
    processes.forEach(p => {
        const times = timeline.filter(t => t.pid === p.pid);
        const completion = Math.max(...times.map(t => t.end));
        const start = Math.min(...times.map(t => t.start));
        totalTurnaround += completion - p.arrival;
        totalWaiting += (completion - p.arrival) - p.burst;
        totalResponse += start - p.arrival;
    });
    ['avgWaitingTime', 'avgTurnaroundTime', 'avgResponseTime'].forEach((id, i) => {
        document.getElementById(id).textContent = 
            [(totalWaiting / n), (totalTurnaround / n), (totalResponse / n)][i].toFixed(2);
    });
    document.getElementById('cpuUtilization').textContent = 
        ((totalBurstTime / makespan) * 100).toFixed(2) + '%';
}
function updateResultsTable() {
    const table = document.createElement('table');
    table.className = 'results-table';
    const headers = ['Process', 'Arrival Time', 'Burst Time', 'Completion Time', 'Turnaround Time', 'Waiting Time', 'Response Time'];
    table.appendChild(Object.assign(document.createElement('thead'), { innerHTML: `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>` }));
    const tbody = table.createTBody();
    processes.forEach(p => {
        const times = timeline.filter(t => t.pid === p.pid);
        const [completion, start] = [Math.max(...times.map(t => t.end)), Math.min(...times.map(t => t.start))];
        const values = [p.pid, p.arrival, p.burst, completion, completion - p.arrival, completion - p.arrival - p.burst, start - p.arrival];
        tbody.innerHTML += `<tr>${values.map(v => `<td>${typeof v === 'number' ? v.toFixed(2) : v}</td>`).join('')}</tr>`;
    });
    document.getElementById('resultsTable').innerHTML = '';
    document.getElementById('resultsTable').appendChild(table);
}

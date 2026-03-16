console.log("App v1.4 starting...");
const state = {
    currentUser: null,
    currentReport: null,
    reports: [],
    users: [
        { user: 'admin', pass: 'admin', role: 'admin', name: 'Administrador' },
        { user: 'arq1', pass: '123', role: 'architect', name: 'Arq. Juan Perez' },
        { user: 'elec1', pass: '123', role: 'electrical', name: 'Ing. Maria Lopez' }
    ]
};

// --- Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.step-screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    window.scrollTo(0, 0);
}

function openDialog(id) { document.getElementById(id).style.display = 'flex'; }
function closeDialog(id) { document.getElementById(id).style.display = 'none'; }

// --- Auth ---
document.getElementById('btn-login').addEventListener('click', () => {
    const userVal = document.getElementById('login-user').value;
    const passVal = document.getElementById('login-pass').value;
    
    const user = state.users.find(u => u.user === userVal && u.pass === passVal);
    if (user) {
        state.currentUser = user;
        document.getElementById('btn-goto-admin').style.display = user.user === 'admin' ? 'block' : 'none';
        renderReports();
        showScreen('dashboard');
    } else {
        alert('Usuario o contraseña incorrectos.');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    state.currentUser = null;
    showScreen('login');
});

// --- Dashboard & Reports ---
function renderReports() {
    const list = document.getElementById('reports-list');
    list.innerHTML = state.reports.length === 0 ? '<p style="text-align:center; opacity:0.5;">No hay informes previos.</p>' : '';
    
    state.reports.forEach(r => {
        const card = document.createElement('div');
        card.className = 'm3-card';
        card.innerHTML = `
            <h3>${r.site} - ${r.date}</h3>
            <p>Inspector: ${r.inspector}</p>
            <div style="margin-top:12px;">
                <button class="m3-btn-text" onclick="viewReport('${r.id}')">Visualizar</button>
                <button class="m3-btn-filled" onclick="editReport('${r.id}')">Editar</button>
            </div>
        `;
        list.appendChild(card);
    });
}

document.getElementById('btn-new-report').addEventListener('click', () => {
    document.getElementById('data-inspector').value = state.currentUser.name;
    showScreen('general-data');
});

document.getElementById('btn-to-console').addEventListener('click', () => {
    const site = document.getElementById('data-site').value;
    const address = document.getElementById('data-address').value;
    if (!site) return alert('Ingrese la sede.');
    
    state.currentReport = {
        id: Date.now(),
        site: site,
        address: address,
        inspector: document.getElementById('data-inspector').value,
        date: document.getElementById('data-date').value,
        observations: []
    };
    
    document.getElementById('badge-role').textContent = state.currentUser.role === 'architect' ? 'Arquitectura' : 'Electricista';
    renderObservations();
    showScreen('console');
});

// --- Inspection Console ---
function renderObservations() {
    const feed = document.getElementById('console-feed');
    feed.innerHTML = state.currentReport.observations.length === 0 ? '<p style="text-align:center; padding:40px; opacity:0.3;">Tome una foto o dicte una observación para comenzar.</p>' : '';
    
    state.currentReport.observations.forEach(obs => {
        const item = document.createElement('div');
        item.className = 'm3-card';
        let imgHtml = obs.image ? `<img src="${obs.image}" class="obs-img-thumb" alt="Evidencia">` : '';
        item.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--lt-navy);">Norma: ${obs.norma}</strong>
                <span class="m3-badge" style="background:#fce8e6; color:#b3261e; font-weight:800;">Riesgo ${obs.risk}</span>
            </div>
            <p style="margin:12px 0; font-size:1.1rem;">${obs.description}</p>
            <p style="font-size:0.85rem; color:#555; background:#f8f9fa; padding:8px; border-radius:8px;">💡 <b>Recomendación:</b> ${obs.recommendation}</p>
        `;
        feed.appendChild(item);
    });
}

document.getElementById('btn-save-obs').addEventListener('click', () => {
    const desc = document.getElementById('obs-description').value;
    if (!desc) return;
    
    const obs = {
        id: Date.now(),
        image: state.tempPhoto || null,
        description: desc,
        risk: document.getElementById('obs-risk').value,
        norma: "Detectando...",
        recommendation: "Analizando..."
    };
    
    state.currentReport.observations.push(obs);
    state.tempPhoto = null; // Reset temp photo
    document.getElementById('obs-description').value = '';
    renderObservations();
    
    // Simulate AI Processing
    setTimeout(() => {
        obs.norma = "RNE Art. 10.2";
        obs.recommendation = "Instalar señalización reflectante a 1.50m.";
        renderObservations();
    }, 1500);
});

// --- Camera / Photo Logic ---
const cameraInput = document.getElementById('camera-input');
document.getElementById('btn-camera').addEventListener('click', () => {
    cameraInput.click();
});

cameraInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            const desc = document.getElementById('obs-description');
            const role = state.currentUser.role === 'architect' ? "Arquitectura" : "Electricidad";
            
            // Temporary storage for the last captured photo in the current session
            state.tempPhoto = base64;
            
            desc.value = `Hallazgo detectado: [Complete la descripción o dicte aquí]`;
            desc.classList.add('is-simulated');
            console.log("Photo processed as base64");
        };
        reader.readAsDataURL(file);
    }
});

// Auto-select/clear simulated text on focus
document.getElementById('obs-description').addEventListener('focus', function() {
    if (this.classList.contains('is-simulated')) {
        this.select(); // Select all so typing replaces it instantly
        this.classList.remove('is-simulated');
    }
});

// --- Voice Transcription (Real-time Gemini Style) ---
let recognition;
const previewArea = document.getElementById('transcription-preview');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-PE';
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        
        // Use a better way to handle final vs interim to avoid duplication
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                const textarea = document.getElementById('obs-description');
                // Ensure we don't duplicate the exact same final chunk if multi-fired
                textarea.value += (textarea.value.endsWith(' ') ? '' : ' ') + transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        previewArea.innerHTML = `<span class="interim-text">${interimTranscript}</span>`;
        const textarea = document.getElementById('obs-description');
        textarea.scrollTop = textarea.scrollHeight;
    };

    recognition.onend = () => {
        previewArea.innerHTML = '';
    };
}

document.getElementById('btn-voice').addEventListener('click', function() {
    const isRecording = this.classList.toggle('active');
    if (isRecording) {
        recognition.start();
        this.innerHTML = '🛑 DETENER';
        this.classList.add('m3-btn-navy'); // Professional Navy for stop
        previewArea.innerHTML = '<i>Escuchando...</i>';
    } else {
        recognition.stop();
        this.innerHTML = '🎤 DICTAR';
        this.classList.remove('m3-btn-navy');
        previewArea.innerHTML = '';
    }
});

// --- Finalize ---
document.getElementById('btn-finish-report').addEventListener('click', () => openDialog('dialog-confirm'));

document.getElementById('btn-confirm-finish').addEventListener('click', () => {
    state.reports.push(state.currentReport);
    closeDialog('dialog-confirm');
    renderPreview();
    showScreen('preview');
});

function renderPreview() {
    const r = state.currentReport;
    document.getElementById('preview-header').innerHTML = `
        <h2 style="color:var(--lt-navy); font-weight:800; font-size:1.8rem;">${r.site}</h2>
        <p style="margin-top:8px;"><b>Inspector:</b> ${r.inspector} | <b>Fecha:</b> ${r.date}</p>
        <p><b>Dirección:</b> ${r.address}</p>
    `;
    
    let tableHtml = `
        <thead>
            <tr>
                <th>Foto</th>
                <th>Hallazgo</th>
                <th>Norma</th>
                <th>Recomendación</th>
                <th>Riesgo</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    r.observations.forEach(o => {
        const imgTag = o.image ? `<img src="${o.image}" class="report-table-img">` : '<div style="font-size:0.6rem; opacity:0.3;">Sin foto</div>';
        tableHtml += `
            <tr>
                <td style="text-align:center;">${imgTag}</td>
                <td>${o.description}</td>
                <td><span style="font-family:monospace; font-size:0.8rem;">${o.norma}</span></td>
                <td>${o.recommendation}</td>
                <td><span class="m3-badge" style="background:#fce8e6; color:#b3261e; scale:0.8;">${o.risk}</span></td>
            </tr>
        `;
    });
    tableHtml += '</tbody>';
    document.getElementById('preview-table').innerHTML = tableHtml;
}

document.getElementById('btn-close-preview').addEventListener('click', () => showScreen('dashboard'));

// --- Admin ---
document.getElementById('btn-goto-admin').addEventListener('click', () => {
    renderAdminUsers();
    showScreen('admin');
});

function renderAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = '';
    state.users.forEach(u => {
        if (u.user === 'admin') return;
        const div = document.createElement('div');
        div.className = 'm3-card';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div>
                <strong>${u.name}</strong> (${u.role})
            </div>
            <button class="m3-btn-text" style="color:var(--md-sys-color-error);" onclick="revokeUser('${u.user}')">Revocar</button>
        `;
        list.appendChild(div);
    });
}

function revokeUser(username) {
    if (confirm(`¿Revocar acceso a ${username}?`)) {
        state.users = state.users.filter(u => u.user !== username);
        renderAdminUsers();
    }
}

window.showScreen = showScreen;
window.viewReport = (id) => { state.currentReport = state.reports.find(r => r.id === id); renderPreview(); showScreen('preview'); };
window.editReport = (id) => { state.currentReport = state.reports.find(r => r.id === id); renderObservations(); showScreen('console'); };
window.revokeUser = revokeUser;
window.closeDialog = closeDialog;

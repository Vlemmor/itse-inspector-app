console.log("App v1.7 starting...");
const state = {
    currentUser: null,
    currentReport: null,
    reports: JSON.parse(localStorage.getItem('itse_reports')) || [],
    users: [
        { user: 'admin', pass: 'admin', role: 'admin', name: 'Administrador' },
        { user: 'arq1', pass: '123', role: 'architect', name: 'Arq. Juan Perez' },
        { user: 'elec1', pass: '123', role: 'electrical', name: 'Ing. Maria Lopez' }
    ],
    save: function() {
        localStorage.setItem('itse_reports', JSON.stringify(this.reports));
        console.log("Data persisted to LocalStorage");
    }
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
    
    state.currentReport.observations.forEach((obs, index) => {
        const item = document.createElement('div');
        item.className = 'm3-card';
        let imgHtml = obs.image ? `<img src="${obs.image}" class="obs-img-thumb" alt="Evidencia">` : '';
        item.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <label style="font-size:0.7rem; color:var(--lt-navy); display:block; margin-bottom:2px; font-weight:700;">NORMA APLICABLE:</label>
                    <input type="text" value="${obs.norma}" 
                           style="border:1px dashed #ccc; background:#fff; font-weight:800; color:var(--lt-navy); width:100%; padding:4px 8px; border-radius:4px;"
                           onblur="state.currentReport.observations[${index}].norma = this.value; state.save();">
                </div>
                <span class="m3-badge" style="background:#fce8e6; color:#b3261e; font-weight:800; margin-left:10px;">Riesgo ${obs.risk}</span>
            </div>
            <p style="margin:12px 0; font-size:1.1rem; line-height:1.4;">${obs.description}</p>
            <div style="background:#f8f9fa; padding:12px; border-radius:12px; border-left:4px solid var(--lt-blue-light); margin-bottom:16px;">
                 <p style="font-size:0.85rem; color:#555;">💡 <b>Recomendación sugerida:</b></p>
                 <textarea style="border:1px dashed #ccc; background:#fff; width:100%; font-size:0.9rem; color:var(--lt-navy); margin-top:4px; padding:8px; border-radius:4px; resize:none;"
                           onblur="state.currentReport.observations[${index}].recommendation = this.value; state.save();">${obs.recommendation}</textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="m3-btn-text" style="color:var(--lt-navy); font-size:0.8rem;" onclick="editObservation(${obs.id})">✏️ RE-EDITAR</button>
                <button class="m3-btn-text" style="color:var(--md-sys-color-error); font-size:0.8rem;" onclick="deleteObservation(${obs.id})">🗑️ BORRAR</button>
            </div>
        `;
        feed.appendChild(item);
    });
}

window.deleteObservation = (id) => {
    if (confirm("¿Eliminar este hallazgo?")) {
        state.currentReport.observations = state.currentReport.observations.filter(o => o.id !== id);
        state.save();
        renderObservations();
    }
};

window.editObservation = (id) => {
    const obs = state.currentReport.observations.find(o => o.id === id);
    if (obs) {
        document.getElementById('obs-description').value = obs.description;
        document.getElementById('obs-risk').value = obs.risk;
        if (obs.image) {
            state.tempPhoto = obs.image;
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            previewImg.src = obs.image;
            previewContainer.style.display = 'block';
        }
        // Remove the one being edited from the list so it can be re-saved
        state.currentReport.observations = state.currentReport.observations.filter(o => o.id !== id);
        renderObservations();
        // Scroll to entry area
        document.getElementById('image-preview-container').scrollIntoView({ behavior: 'smooth' });
    }
};

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
    state.tempPhoto = null; 
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('obs-description').value = '';
    
    // Auto-stop dictation if active
    if (document.getElementById('btn-voice').classList.contains('active')) {
        document.getElementById('btn-voice').click();
    }
    
    state.save(); // Save every observation
    renderObservations();
    
    // LLAMADA AL BACKEND REAL (Agente Simplificado)
    fetch('http://localhost:8000/analyze-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            description: desc,
            role: state.currentUser.role,
            image_base64: obs.image
        })
    })
    .then(res => res.json())
    .then(data => {
        obs.norma = data.norma;
        obs.recommendation = data.recommendation;
        obs.risk = data.risk;
        state.save();
        renderObservations();
    })
    .catch(err => {
        console.error("Error llamando al supervisor:", err);
        // Fallback or keep "Analizando..."
    });
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
            state.tempPhoto = base64;
            
            // Show Preview
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            previewImg.src = base64;
            previewContainer.style.display = 'block';
            
            // REEMPLAZO: Llamar a la IA de Visión real encargada del análisis
            fetch('http://localhost:8000/describe-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: base64,
                    role: state.currentUser.role
                })
            })
            .then(res => res.json())
            .then(data => {
                desc.value = data.description;
                desc.classList.add('is-simulated');
                desc.style.background = '#f1f8e9'; // Verde suave para indicar éxito de IA
                setTimeout(() => desc.style.background = 'white', 1000);
            })
            .catch(err => {
                console.error("Error en análisis de visión:", err);
                desc.value = "Se requiere descripción manual.";
            });
            
            console.log("Photo analysis requested to backend");
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('btn-clear-image').addEventListener('click', () => {
    state.tempPhoto = null;
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('camera-input').value = ''; // Reset input so same file can be retaken
});

// Auto-select/clear simulated text on focus
document.getElementById('obs-description').addEventListener('focus', function() {
    if (this.classList.contains('is-simulated')) {
        this.select(); // Select all so typing replaces it instantly
        this.classList.remove('is-simulated');
    }
});

// --- Voice Transcription (Refined "Definitive" Solution) ---
let recognition;
let baseText = ''; 
const previewArea = document.getElementById('transcription-preview');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-PE';
    
    recognition.onresult = (event) => {
        let sessionFinal = '';
        let interim = '';
        const textarea = document.getElementById('obs-description');
        
        // Reconstruimos el texto de la sesión actual sin duplicados
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                sessionFinal += event.results[i][0].transcript;
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        
        // El valor final es el texto que ya estaba + lo dictado (final e interim)
        textarea.value = (baseText + ' ' + sessionFinal + ' ' + interim).replace(/\s+/g, ' ').trim();
        previewArea.innerHTML = `<span class="interim-text">${interim}</span>`;
        textarea.scrollTop = textarea.scrollHeight;
    };

    recognition.onend = () => {
        previewArea.innerHTML = '';
        baseText = document.getElementById('obs-description').value; // Update base for next session
    };
}

document.getElementById('btn-voice').addEventListener('click', function() {
    const isRecording = this.classList.toggle('active');
    const textarea = document.getElementById('obs-description');
    
    if (isRecording) {
        baseText = textarea.value; // Store current text
        recognition.start();
        this.innerHTML = '🛑 DETENER';
        this.classList.add('recording'); 
    } else {
        recognition.stop();
        this.innerHTML = '🎤 DICTAR';
        this.classList.remove('recording');
        setTimeout(() => textarea.focus(), 150);
    }
});

// --- Finalize ---
document.getElementById('btn-finish-report').addEventListener('click', () => openDialog('dialog-confirm'));

document.getElementById('btn-confirm-finish').addEventListener('click', () => {
    // Check if editing an existing report or saving new
    const existingIndex = state.reports.findIndex(r => r.id === state.currentReport.id);
    if (existingIndex > -1) {
        state.reports[existingIndex] = state.currentReport;
    } else {
        state.reports.push(state.currentReport);
    }
    
    state.save(); // Persist to localStorage
    closeDialog('dialog-confirm');
    renderPreview();
    showScreen('preview');
    renderReports(); // Update dashboard list
});

function renderPreview() {
    const r = state.currentReport;
    document.getElementById('preview-header').innerHTML = `
        <h2 style="color:var(--lt-navy); font-weight:800; font-size:1.8rem; margin-top:20px;">${r.site}</h2>
        <p style="margin-top:8px;"><b>Inspector:</b> ${r.inspector} | <b>Fecha:</b> ${r.date}</p>
        <p><b>Dirección:</b> ${r.address}</p>
    `;
    
    const tbody = document.createElement('tbody');
    r.observations.forEach((o, index) => {
        const tr = document.createElement('tr');
        const imgTag = o.image ? `<img src="${o.image}" class="report-table-img">` : '<div style="font-size:0.6rem; opacity:0.3;">Sin foto</div>';
        
        tr.innerHTML = `
            <td style="text-align:center;">${imgTag}</td>
            <td contenteditable="true" class="editable-cell" onblur="updateObservationData(${index}, 'description', this.innerText)">${o.description}</td>
            <td contenteditable="true" class="editable-cell" onblur="updateObservationData(${index}, 'norma', this.innerText)">${o.norma}</td>
            <td contenteditable="true" class="editable-cell" onblur="updateObservationData(${index}, 'recommendation', this.innerText)">${o.recommendation}</td>
            <td><span class="m3-badge" style="background:#fce8e6; color:#b3261e; scale:0.8;">${o.risk}</span></td>
        `;
        tbody.appendChild(tr);
    });
    
    const table = document.getElementById('preview-table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Foto</th>
                <th>Hallazgo</th>
                <th>Norma</th>
                <th>Recomendación</th>
                <th>Riesgo</th>
            </tr>
        </thead>
    `;
    table.appendChild(tbody);
}

window.updateObservationData = (index, field, value) => {
    state.currentReport.observations[index][field] = value;
    console.log(`Updated obs ${index} field ${field}`);
};

// --- Export Logic ---
document.getElementById('btn-export-pdf').addEventListener('click', () => {
    window.print();
});

document.getElementById('btn-export-excel').addEventListener('click', () => {
    const r = state.currentReport;
    let csv = "ID,Fecha,Sede,Hallazgo,Norma,Recomendacion,Riesgo\n";
    r.observations.forEach(o => {
        csv += `${r.id},${r.date},"${r.site}","${o.description}","${o.norma}","${o.recommendation}",${o.risk}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Informe_${r.site.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

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

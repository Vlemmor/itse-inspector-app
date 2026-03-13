document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    let currentRole = 'architect';
    const hallazgos = [];
    
    const normativas = {
        architect: [
            { key: 'señalizacion', norma: 'RNE A.130 Prop. 2.1', desc: 'Falta de señalética reflectante.' },
            { key: 'extintor', norma: 'RNE A.130 Art. 165', desc: 'Extintor obstruido o vencido.' },
            { key: 'pasillo', norma: 'RNE A.010 Art. 25', desc: 'Ancho de pasillo insuficiente.' }
        ],
        electrical: [
            { key: 'tablero', norma: 'CNE Utilización Art. 10.2.3', desc: 'Tablero sin mandil o señalización.' },
            { key: 'cables', norma: 'CNE Utilización Secc. 070', desc: 'Conductores expuestos.' },
            { key: 'pozo', norma: 'CNE Utilización Art. 060-002', desc: 'Resistencia de puesta a tierra.' }
        ]
    };

    // --- Navigation Logic ---
    function showStep(stepNumber) {
        document.querySelectorAll('.step-screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${stepNumber}`).classList.add('active');
        window.scrollTo(0, 0);
    }

    // --- UI Elements ---
    const roleBtns = document.querySelectorAll('.role-btn');
    const btnStart = document.getElementById('btn-start-inspection');
    const btnBack = document.querySelector('.btn-back');
    const specialtyIndicator = document.getElementById('current-specialty');
    
    // Inputs
    const siteInput = document.getElementById('site-name');
    const inspectorInput = document.getElementById('inspector-name');
    const dateInput = document.getElementById('inspection-date');
    const manualTextInput = document.getElementById('manual-text');
    
    // Actions
    const btnCamera = document.getElementById('btn-camera');
    const cameraInput = document.getElementById('camera-input');
    const btnVoice = document.getElementById('btn-voice');
    const btnSend = document.getElementById('btn-send');
    const btnFinish = document.getElementById('btn-finish');
    const feed = document.getElementById('hallazgos-feed');

    // --- Step 1 -> 2 ---
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentRole = btn.dataset.role;
            document.body.className = `mode-${currentRole}`;
            specialtyIndicator.textContent = currentRole === 'electrical' ? 'Ing. Electricista' : 'Arquitectura';
            showStep(2);
        });
    });

    // --- Step 2 -> 3 ---
    btnStart.addEventListener('click', () => {
        if (!siteInput.value || !inspectorInput.value) {
            alert('Por favor complete los datos del local e inspector.');
            return;
        }
        showStep(3);
    });

    btnBack.addEventListener('click', () => showStep(1));

    // --- REAL HARDWARE: CAMERA ---
    btnCamera.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                createHallazgo(manualTextInput.value || "Captura de Hallazgo", event.target.result);
                manualTextInput.value = '';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // --- REAL HARDWARE: VOICE-TO-TEXT ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-PE';
        
        btnVoice.addEventListener('click', () => {
            recognition.start();
            showAIStatus('Escuchando dictado...');
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            manualTextInput.value = transcript;
            showAIStatus('Texto capturado ✅');
        };
    } else {
        btnVoice.onclick = () => alert('Su navegador no soporta dictado por voz.');
    }

    // --- Observation Creation ---
    btnSend.addEventListener('click', () => {
        if (manualTextInput.value.trim()) {
            createHallazgo(manualTextInput.value, null);
            manualTextInput.value = '';
        }
    });

    function createHallazgo(text, imageSrc) {
        showAIStatus('Analizando Normativa...');
        
        setTimeout(() => {
            const normaInfo = detectNorma(text);
            const h = { id: Date.now(), text, imageSrc, ...normaInfo };
            renderHallazgo(h);
            showAIStatus('Hallazgo Registrado ✨');
        }, 800);
    }

    function detectNorma(text) {
        const lower = text.toLowerCase();
        const pool = normativas[currentRole];
        return pool.find(n => lower.includes(n.key)) || { 
            norma: currentRole === 'electrical' ? 'CNE Genérico' : 'RNE Genérico',
            desc: 'Revisión técnica sugerida.' 
        };
    }

    function renderHallazgo(h) {
        const empty = feed.querySelector('.empty-state');
        if (empty) empty.remove();

        const card = document.createElement('div');
        card.className = 'hallazgo-card glass-card';
        card.innerHTML = `
            ${h.imageSrc ? `
                <div class="photo-preview">
                    <img src="${h.imageSrc}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="enhance-tag">AI ENHANCED</div>
                </div>` : ''}
            <p class="hallazgo-text">"${h.text}"</p>
            <div class="norma-box">
                <strong>${h.norma}</strong>
                <p>${h.desc}</p>
            </div>
        `;
        feed.prepend(card);
    }

    function showAIStatus(msg) {
        const status = document.getElementById('ai-status');
        document.getElementById('ai-msg').textContent = msg;
        status.classList.add('active');
        setTimeout(() => status.classList.remove('active'), 2500);
    }

    btnFinish.addEventListener('click', () => {
        if (confirm('¿Desea cerrar este informe?')) {
            alert('Enviando informe a Robot 4...');
            location.reload();
        }
    });
});

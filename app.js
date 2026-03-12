document.addEventListener('DOMContentLoaded', () => {
    // --- State & Data ---
    let currentRole = 'architect';
    const hallazgos = [];
    
    // Normatives Database (Simulated IA)
    const normativas = {
        architect: [
            { key: 'señalizacion', norma: 'RNE A.130 Prop. 2.1', desc: 'Falta de señalética reflectante en rutas de evacuación.' },
            { key: 'iluminacion', norma: 'RNE A.130 Art. 45', desc: 'Iluminación de emergencia insuficiente en zonas comunes.' },
            { key: 'extintor', norma: 'RNE A.130 Art. 165', desc: 'Extintor obstruido o sin señalización adecuada.' },
            { key: 'pasillo', norma: 'RNE A.010 Art. 25', desc: 'Ancho de pasillo no cumple con el aforo calculado.' }
        ],
        electrical: [
            { key: 'tablero', norma: 'CNE Utilización Art. 10.2.3', desc: 'Tablero eléctrico sin mandil de protección o señalización de riesgo.' },
            { key: 'cables', norma: 'CNE Utilización Secc. 070', desc: 'Conductores expuestos o con aislamiento deteriorado.' },
            { key: 'pozo', norma: 'CNE Utilización Art. 060-002', desc: 'Resistencia de puesta a tierra fuera de rango normativo.' },
            { key: 'puesta a tierra', norma: 'CNE Utilización Art. 060-402', desc: 'Falta de continuidad en el sistema de puesta a tierra.' }
        ]
    };

    // --- UI Elements ---
    const roleSelector = document.getElementById('role-selector');
    const roleBtns = document.querySelectorAll('.role-btn');
    const specialtyIndicator = document.getElementById('current-specialty');
    const hallazgosFeed = document.getElementById('hallazgos-feed');
    const aiStatus = document.getElementById('ai-status');
    const aiMsg = document.getElementById('ai-msg');
    
    const btnVoice = document.getElementById('btn-voice');
    const btnCamera = document.getElementById('btn-camera');
    const btnFinish = document.getElementById('btn-finish');

    // --- Role Selection ---
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentRole = btn.dataset.role;
            document.body.className = `mode-${currentRole}`;
            specialtyIndicator.textContent = currentRole === 'electrical' ? 'Ing. Electricista' : 'Arquitectura';
            roleSelector.style.display = 'none';
        });
    });

    // --- IA Copilot Logic ---
    function showAIStatus(msg) {
        aiMsg.textContent = msg;
        aiStatus.classList.add('active');
        setTimeout(() => aiStatus.classList.remove('active'), 2500);
    }

    function detectNorma(text) {
        const lowerText = text.toLowerCase();
        const pool = normativas[currentRole];
        return pool.find(n => lowerText.includes(n.key)) || { 
            norma: currentRole === 'electrical' ? 'CNE Genérico' : 'RNE Genérico',
            desc: 'Observación técnica para revisión.' 
        };
    }

    // --- Event Handlers ---
    let recording = false;
    btnVoice.addEventListener('click', () => {
        recording = !recording;
        const ring = btnVoice.querySelector('.pulse-ring');
        
        if (recording) {
            ring.style.display = 'block';
            showAIStatus('Escuchando dictado...');
        } else {
            ring.style.display = 'none';
            // Simulate voice-to-text result
            const simulatedDictados = currentRole === 'electrical' 
                ? ["Tablero principal sin mandil", "Cables expuestos en subestación", "Pozo a tierra sulfatado"]
                : ["Falta señalización en pasillo", "Extintor vencido", "Iluminación deficiente"];
            
            const randomText = simulatedDictados[Math.floor(Math.random() * simulatedDictados.length)];
            processHallazgo(randomText, true);
        }
    });

    btnCamera.addEventListener('click', () => {
        showAIStatus('Capturando Hallazgo...');
        setTimeout(() => {
            const simulatedText = currentRole === 'electrical' ? "Falla eléctrica detectada" : "Defecto estructural detectado";
            processHallazgo(simulatedText, false);
        }, 1500);
    });

    function processHallazgo(text, isVoice) {
        showAIStatus('IA Optimizando Foto...');
        
        setTimeout(() => {
            const infoNormativa = detectNorma(text);
            const location = document.getElementById('location-exact').value || 'Ubicación General';
            
            const hallazgo = {
                id: Date.now(),
                text: text,
                norma: infoNormativa.norma,
                descNorma: infoNormativa.desc,
                location: location,
                timestamp: new Date().toLocaleTimeString()
            };

            addHallazgoToUI(hallazgo);
            showAIStatus('Hallazgo Registrado ✨');
        }, 1000);
    }

    function addHallazgoToUI(h) {
        // Remove empty state
        const empty = hallazgosFeed.querySelector('.empty-state');
        if (empty) empty.remove();

        const card = document.createElement('div');
        card.className = 'hallazgo-card glass-card';
        card.innerHTML = `
            <div class="photo-preview">
                <div class="img-comparison">
                    <img src="https://picsum.photos/seed/${h.id}/400/300" alt="Hallazgo">
                    <div class="enhance-tag">AI ENHANCED</div>
                </div>
            </div>
            <div class="hallazgo-info">
                <div class="form-group">
                    <label>📍 ${h.location}</label>
                    <p class="hallazgo-text">"${h.text}"</p>
                </div>
                <div class="norma-box">
                    <strong>NORMATIVA DETECTADA: ${h.norma}</strong>
                    <p>${h.descNorma}</p>
                </div>
            </div>
        `;
        hallazgosFeed.prepend(card);
    }

    btnFinish.addEventListener('click', () => {
        if (confirm('¿Desea finalizar el informe y sincronizar con el Dashboard de Gloria?')) {
            showAIStatus('Sincronizando con Robot 4...');
            setTimeout(() => {
                alert('Informe enviado con éxito.\nFormato: PDF Premium & Excel\nEstado: CERRADO');
                location.reload();
            }, 2000);
        }
    });
});

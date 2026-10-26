window.showToast = function(message, icon = 'check_circle') {
    const toast = document.getElementById('custom-toast');
    if(!toast) return;
    const msg = document.getElementById('toast-message'); if(msg) msg.innerText = message;
    const icn = document.getElementById('toast-icon'); if(icn) icn.innerText = icon;
    toast.className = 'toast-visible';
    setTimeout(() => { toast.className = 'toast-hidden'; }, 3500);
};

window.setNowTime = function() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    
    const fechaInput = document.getElementById('jornada-fecha');
    if(fechaInput) fechaInput.value = `${y}-${m}-${d}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    
    const inicioInput = document.getElementById('jornada-inicio');
    if(inicioInput) inicioInput.value = `${hours}:${mins}`;
    
    window.showToast('¡Hora actual registrada!', 'bolt');
};

// === CONTROL DEL MENÚ RÁPIDO (3 BARRAS) ===
window.openMenuModal = function() {
    const m = document.getElementById('menu-modal');
    if(m) m.classList.add('visible');
};

window.closeMenuModal = function() {
    const m = document.getElementById('menu-modal');
    if(m) m.classList.remove('visible');
};

window.exportData = function() {
    try {
        const perfilStr = localStorage.getItem('wtc_perfil') || '{}';
        const jornadasStr = localStorage.getItem('wtc_jornadas') || '[]';
        const data = {
            version: "1.0",
            app: "CWT",
            perfil: JSON.parse(perfilStr),
            jornadas: JSON.parse(jornadasStr)
        };
        const jsonString = JSON.stringify(data, null, 2);
        const filename = `CWT_Respaldo_${Date.now()}.json`;

        if (window.NativeSaveJSON) {
            window.NativeSaveJSON(jsonString, filename).then(() => {
                window.showToast('Respaldo generado con éxito', 'download');
            }).catch(err => {
                window.showToast('Error al exportar respaldo', 'error');
            });
        } else {
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            window.showToast('Respaldo exportado con éxito', 'download');
        }
    } catch(e) {
        window.showToast('Error al exportar', 'error');
    }
    window.closeMenuModal();
};

window.importData = function(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const data = JSON.parse(text);
            if(data && (data.perfil || data.jornadas)) {
                if(data.perfil) localStorage.setItem('wtc_perfil', JSON.stringify(data.perfil));
                if(data.jornadas) localStorage.setItem('wtc_jornadas', JSON.stringify(data.jornadas));
                cargarPerfil();
                renderizarInicio();
                renderizarInforme();
                window.showToast('¡Datos restaurados con éxito!', 'task_alt');
            } else {
                window.showToast('Archivo de respaldo inválido', 'error');
            }
        } catch(err) {
            window.showToast('Archivo de respaldo inválido', 'error');
        }
    };
    reader.onerror = function() {
        window.showToast('Error leyendo el archivo', 'error');
    };
    reader.readAsText(file);
    window.closeMenuModal();
};

window.confirmClearHistoryModal = function() {
    window.closeMenuModal();
    idParaEliminar = 'ALL';
    const m = document.getElementById('delete-confirm-modal');
    if(m) m.classList.add('visible');
};

// === CONTROL DE CAMBIO RÁPIDO DE TARIFA (PERFIL) ===
window.openQuickRateModal = function() {
    try {
        const p = JSON.parse(localStorage.getItem('wtc_perfil')) || { moneda: 'Q', tarifa: 0 };
        const mInput = document.getElementById('quick-moneda'); if(mInput) mInput.value = p.moneda || '';
        const tInput = document.getElementById('quick-tarifa'); if(tInput) tInput.value = p.tarifa || '';
    } catch(e){}
    const mod = document.getElementById('quick-rate-modal');
    if(mod) mod.classList.add('visible');
};

window.closeQuickRateModal = function() {
    const mod = document.getElementById('quick-rate-modal');
    if(mod) mod.classList.remove('visible');
};

window.saveQuickRate = function() {
    try {
        let p = JSON.parse(localStorage.getItem('wtc_perfil')) || { nombre: 'Usuario', festivo: 100 };
        const mInput = document.getElementById('quick-moneda'); 
        const tInput = document.getElementById('quick-tarifa');
        if(mInput) p.moneda = mInput.value;
        if(tInput) p.tarifa = parseFloat(tInput.value) || 0;
        localStorage.setItem('wtc_perfil', JSON.stringify(p));
        window.showToast('¡Tarifa actualizada!', 'verified_user');
        cargarPerfil();
        renderizarInicio();
        renderizarInforme();
    } catch(e){}
    window.closeQuickRateModal();
};

let currentInputTarget = null;
function initTimePicker() {
    const colHours = document.getElementById('tp-hours'); const colMins = document.getElementById('tp-minutes');
    let htmlHours = '<div class="time-item empty"></div>'; for(let i=0; i<24; i++) { let val = i.toString().padStart(2, '0'); htmlHours += `<div class="time-item" data-val="${val}">${val}</div>`; } htmlHours += '<div class="time-item empty"></div>'; 
    if(colHours) colHours.innerHTML = htmlHours;
    let htmlMins = '<div class="time-item empty"></div>'; for(let i=0; i<60; i++) { let val = i.toString().padStart(2, '0'); htmlMins += `<div class="time-item" data-val="${val}">${val}</div>`; } htmlMins += '<div class="time-item empty"></div>'; 
    if(colMins) colMins.innerHTML = htmlMins;
}
window.openTimePicker = function(inputId) {
    currentInputTarget = document.getElementById(inputId); 
    document.getElementById('time-picker-modal').classList.add('visible');
    let val = currentInputTarget.value; let h = 0, m = 0; if(val) [h, m] = val.split(':').map(Number);
    const colHours = document.getElementById('tp-hours'); const colMins = document.getElementById('tp-minutes');
    setTimeout(() => { if(colHours) colHours.scrollTop = h * 50; if(colMins) colMins.scrollTop = m * 50; }, 50);
};
window.closeTimePicker = function() { document.getElementById('time-picker-modal').classList.remove('visible'); };
window.confirmTimePicker = function() {
    const colHours = document.getElementById('tp-hours'); const colMins = document.getElementById('tp-minutes');
    let hIdx = colHours ? Math.round(colHours.scrollTop / 50) : 0; 
    let mIdx = colMins ? Math.round(colMins.scrollTop / 50) : 0;
    if(hIdx > 23) hIdx = 23; if(mIdx > 59) mIdx = 59;
    if (currentInputTarget) { currentInputTarget.value = `${hIdx.toString().padStart(2, '0')}:${mIdx.toString().padStart(2, '0')}`; }
    window.closeTimePicker();
};

let currentDate = new Date(); let selectedDate = new Date();
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function renderCalendar() {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const lbl = document.getElementById('dp-month-year'); if(lbl) lbl.innerText = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('dp-days-grid'); if(!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < firstDay; i++) { grid.innerHTML += `<div class="dp-day empty"></div>`; }
    for (let i = 1; i <= daysInMonth; i++) {
        const isSelected = (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear());
        grid.innerHTML += `<div class="dp-day ${isSelected ? 'selected' : ''}" onclick="selectDate(${year}, ${month}, ${i})">${i}</div>`;
    }
}
window.openDatePicker = function() {
    const inputVal = document.getElementById('jornada-fecha').value;
    if(inputVal) { const [y, m, d] = inputVal.split('-'); selectedDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d)); currentDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
    } else { selectedDate = new Date(); currentDate = new Date(); }
    renderCalendar(); document.getElementById('date-picker-modal').classList.add('visible');
};
window.closeDatePicker = function() { document.getElementById('date-picker-modal').classList.remove('visible'); };
window.selectDate = function(y, m, d) { selectedDate = new Date(y, m, d); renderCalendar(); };
window.prevMonth = function() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
window.nextMonth = function() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
window.confirmDatePicker = function() {
    const y = selectedDate.getFullYear(); const m = String(selectedDate.getMonth() + 1).padStart(2, '0'); const d = String(selectedDate.getDate()).padStart(2, '0');
    const inputF = document.getElementById('jornada-fecha'); if(inputF) inputF.value = `${y}-${m}-${d}`; 
    window.closeDatePicker();
};

const navItems = document.querySelectorAll('.nav-item'); const screens = document.querySelectorAll('.screen');
function switchScreen(targetId, navIndex) {
    screens.forEach(screen => screen.classList.remove('active')); navItems.forEach(item => item.classList.remove('active'));
    const t = document.getElementById(targetId); if(t) t.classList.add('active'); 
    if(navItems[navIndex]) navItems[navIndex].classList.add('active');
    if(targetId === 'view-inicio') renderizarInicio(); if(targetId === 'view-informes') renderizarInforme();
}
navItems.forEach(item => { item.addEventListener('click', () => { 
        switchScreen(item.getAttribute('data-target'), parseInt(item.getAttribute('data-index'))); }); });

const fechaDash = document.getElementById('fecha-dashboard');
if (fechaDash) { fechaDash.textContent = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); }

const formPerfil = document.getElementById('form-perfil');
if(formPerfil) {
    formPerfil.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const nInput = document.getElementById('perfil-nombre'); const mInput = document.getElementById('perfil-moneda'); const tInput = document.getElementById('perfil-tarifa'); const fInput = document.getElementById('perfil-festivo');
        const perfil = { nombre: nInput?nInput.value:'', moneda: mInput?mInput.value:'', tarifa: tInput?parseFloat(tInput.value)||0:0, festivo: fInput?parseFloat(fInput.value)||0:0 };
        localStorage.setItem('wtc_perfil', JSON.stringify(perfil)); 
        window.showToast('¡Perfil guardado correctamente!', 'verified_user'); renderizarInicio(); renderizarInforme();
    });
}
function cargarPerfil() {
    const guardado = localStorage.getItem('wtc_perfil');
    if (guardado) { const p = JSON.parse(guardado); 
        const nInput = document.getElementById('perfil-nombre'); if(nInput) nInput.value = p.nombre || ''; 
        const mInput = document.getElementById('perfil-moneda'); if(mInput) mInput.value = p.moneda || ''; 
        const tInput = document.getElementById('perfil-tarifa'); if(tInput) tInput.value = p.tarifa || ''; 
        const fInput = document.getElementById('perfil-festivo'); if(fInput) fInput.value = p.festivo || ''; 
    }
}

let idEditando = null;
let idParaEliminar = null;

window.eliminarJornada = function(id) {
    idParaEliminar = id;
    const m = document.getElementById('delete-confirm-modal');
    if(m) m.classList.add('visible');
};

window.closeDeleteModal = function() {
    idParaEliminar = null;
    const m = document.getElementById('delete-confirm-modal');
    if(m) m.classList.remove('visible');
};

window.confirmDeleteModal = function() {
    if(idParaEliminar === 'ALL') {
        localStorage.removeItem('wtc_jornadas');
        renderizarInicio(); 
        renderizarInforme(); 
        window.showToast('Historial borrado', 'delete');
    } else if(idParaEliminar) {
        let h = JSON.parse(localStorage.getItem('wtc_jornadas')) || []; 
        h = h.filter(j => j.id !== idParaEliminar);
        localStorage.setItem('wtc_jornadas', JSON.stringify(h)); 
        renderizarInicio(); 
        renderizarInforme(); 
        window.showToast('Jornada eliminada', 'delete');
    }
    window.closeDeleteModal();
};

// === CAMBIAR ESTADO DE PAGO (POR COBRAR / PAGADO) ===
window.toggleEstadoPago = function(id) {
    let h = JSON.parse(localStorage.getItem('wtc_jornadas')) || [];
    const j = h.find(x => x.id === id);
    if(j) {
        j.pagado = !j.pagado;
        localStorage.setItem('wtc_jornadas', JSON.stringify(h));
        renderizarInicio();
        renderizarInforme();
        window.showToast(j.pagado ? 'Marcado como Pagado' : 'Marcado como Por Cobrar', 'payments');
    }
};

let currentChartFilterValue = '15';

window.openChartFilterModal = function() {
    const m = document.getElementById('chart-filter-modal');
    if(m) m.classList.add('visible');
};

window.closeChartFilterModal = function() {
    const m = document.getElementById('chart-filter-modal');
    if(m) m.classList.remove('visible');
};

window.selectChartFilter = function(value, label) {
    currentChartFilterValue = value;
    const lbl = document.getElementById('filtro-grafica-label');
    if(lbl) lbl.innerText = label;
    window.closeChartFilterModal();
    window.renderizarInforme();
};

window.prepararEdicion = function(id) {
    const h = JSON.parse(localStorage.getItem('wtc_jornadas')) || []; const j = h.find(x => x.id === id); if(!j) return;
    idEditando = id; 
    const fInput = document.getElementById('jornada-fecha'); if(fInput) fInput.value = j.fecha; 
    const iInput = document.getElementById('jornada-inicio'); if(iInput) iInput.value = j.inicio; 
    const hInput = document.getElementById('jornada-fin'); if(hInput) hInput.value = j.fin; 
    const pInput = document.getElementById('jornada-pausa'); if(pInput) pInput.value = j.pausaMinutos;
    const tipoF = j.tipoFestivo ? j.tipoFestivo : (j.esFestivo ? 'all' : 'none'); 
    const tInput = document.getElementById('jornada-tipo-festivo'); if(tInput) tInput.value = tipoF;
    let nota = j.notas || ''; if(nota.includes('|')) nota = nota.split('|')[1].trim();  
    const nInput = document.getElementById('jornada-notas'); if(nInput) nInput.value = nota;
    const btnG = document.getElementById('btn-guardar-jornada'); if(btnG) btnG.innerHTML = 'Actualizar Jornada';
    const btnC = document.getElementById('btn-cancelar-edicion'); if(btnC) btnC.style.display = 'flex';
    switchScreen('view-jornadas', 1);
};
window.cancelarEdicion = function() {
    idEditando = null; try { document.getElementById('form-jornada').reset(); } catch(e) {}
    let hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset()); 
    const fInput = document.getElementById('jornada-fecha'); if(fInput) fInput.value = hoy.toISOString().split('T')[0]; 
    const iInput = document.getElementById('jornada-inicio'); if(iInput) iInput.value = ''; 
    const hInput = document.getElementById('jornada-fin'); if(hInput) hInput.value = '';
    const btnG = document.getElementById('btn-guardar-jornada'); if(btnG) btnG.innerHTML = 'Guardar Jornada';
    const btnC = document.getElementById('btn-cancelar-edicion'); if(btnC) btnC.style.display = 'none';
    renderizarInicio(); renderizarInforme(); switchScreen('view-inicio', 0);
};

function renderizarInicio() {
    const cont = document.getElementById('inicio-lista-jornadas'); if(!cont) return;
    const h = JSON.parse(localStorage.getItem('wtc_jornadas')) || []; const p = JSON.parse(localStorage.getItem('wtc_perfil')) || { moneda: 'Q' };
    const txtD = document.getElementById('inicio-total-dinero'); const txtH = document.getElementById('inicio-total-horas');

    let sumD = 0; let sumH = 0;
    if (h.length === 0) { 
        cont.innerHTML = '<p style="color: #64748b; text-align: center; margin-top: 20px;">No hay transacciones.</p>';
        if(txtD) txtD.textContent = `${p.moneda} 0.00`; if(txtH) txtH.textContent = `0.00 hrs acumuladas`; return;
    }

    for (const j of h) { sumD += parseFloat(j.totalEstimado || 0); sumH += parseFloat(j.horasTrabajadas || 0); }
    if(txtD) txtD.textContent = `${p.moneda} ${sumD.toFixed(2)}`; if(txtH) txtH.textContent = `${sumH.toFixed(2)} hrs acumuladas`;

    const hInv = [...h].reverse(); 
    cont.innerHTML = ''; 
    for (const j of hInv) {
        const item = document.createElement('div'); 
        item.className = 'swipe-container'; 
        let fVis = j.fechaMostrar || j.fecha;
        let icClass = (j.tipoFestivo && j.tipoFestivo !== 'none') ? "celebration" : "work_history";
        let isPagado = j.pagado === true;
        let badgeClass = isPagado ? "paid" : "pending";
        let badgeText = isPagado ? "Pagado" : "Por Cobrar";
        
        item.innerHTML = `
            <div class="swipe-content">
                <div class="jornada-icon"><span class="material-symbols-rounded">${icClass}</span></div>
                <div class="jornada-info">
                    <h4>${fVis}</h4>
                    <p>${j.inicio} - ${j.fin} | ${j.notas || 'Turno Regular'}</p>
                    <span class="status-badge ${badgeClass}" onclick="toggleEstadoPago('${j.id}')">${badgeText}</span>
                </div>
                <div class="jornada-amount"><h4>${j.moneda} ${j.totalEstimado}</h4><p>+${j.horasTrabajadas}h</p></div>
            </div>
            <div class="swipe-actions">
                <button onclick="prepararEdicion('${j.id}')" class="swipe-btn edit"><span class="material-symbols-rounded">edit</span></button>
                <button onclick="eliminarJornada('${j.id}')" class="swipe-btn delete"><span class="material-symbols-rounded">delete</span></button>
            </div>
        `;
        cont.appendChild(item);
    }
}

const formJornada = document.getElementById('form-jornada');
if(formJornada) {
    let hoyJ = new Date(); hoyJ.setMinutes(hoyJ.getMinutes() - hoyJ.getTimezoneOffset());
    const fInput = document.getElementById('jornada-fecha'); if(fInput) fInput.value = hoyJ.toISOString().split('T')[0];

    formJornada.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const fInput = document.getElementById('jornada-fecha'); const iInput = document.getElementById('jornada-inicio'); const hInput = document.getElementById('jornada-fin'); const pInput = document.getElementById('jornada-pausa'); const tInput = document.getElementById('jornada-tipo-festivo'); const nInput = document.getElementById('jornada-notas');
        const fecha = fInput?fInput.value:''; const inicio = iInput?iInput.value:'00:00'; const fin = hInput?hInput.value:'00:00'; const pausaMinutos = pInput?parseInt(pInput.value)||0:0; const tipoFestivo = tInput?tInput.value:'none'; const notasUsuario = nInput?nInput.value:''; 
        const perfil = JSON.parse(localStorage.getItem('wtc_perfil')) || { tarifa: 0, festivo: 0, moneda: '' };
        
        let [hIni, mIni] = inicio.split(':').map(Number); let [hFin, mFin] = fin.split(':').map(Number);
        let minT1 = 0; let minT2 = 0; let cruza = false;

        if ((hFin * 60 + mFin) <= (hIni * 60 + mIni) && inicio !== fin) { cruza = true; minT1 = (24 * 60) - (hIni * 60 + mIni); minT2 = (hFin * 60 + mFin); } 
        else { minT1 = (hFin * 60 + mFin) - (hIni * 60 + mIni); }
        let minTot = minT1 + minT2; if (minTot === 0 && inicio === fin) { minTot = 24 * 60;

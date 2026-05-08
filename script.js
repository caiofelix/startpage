function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${hours}:${minutes}`;

    const greetingEl = document.getElementById('greeting');
    if(greetingEl) {
        //const hour = now.getHours();
        //let greeting = "Boa Noite";
        //if (hour < 12) greeting = "Bom Dia";
        //else if (hour < 18) greeting = "Boa Tarde";
        let greeting = "Hello World";
        greetingEl.textContent = `${greeting}`;
    }
}

function toggleMenu(id) {
    const menu = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        icon.textContent = 'expand_less';
    } else {
        menu.classList.add('hidden');
        icon.textContent = 'expand_more';
    }
}

setInterval(updateClock, 1000);
updateClock();

// --- RU LOGIC ---

function getRUConfig() {
    const conf = localStorage.getItem('ru_config');
    return conf ? JSON.parse(conf) : null;
}

function showRUConfigForm() {
    const container = document.getElementById('ru-content');
    const existing = getRUConfig() || { url: '', codigo: '', matricula: '' };
    
    container.innerHTML = `
        <form onsubmit="saveRUConfig(event)" class="col-span-1 md:col-span-3 bg-surface p-xl rounded-lg border border-surface-variant/30 flex flex-col gap-md">
            <h4 class="text-on-surface font-medium mb-sm text-lg">Configurar Restaurante Universitário</h4>
            <div class="flex flex-col gap-xs">
                <label class="text-label-sm text-on-surface-variant">Worker URL</label>
                <input type="url" id="ru_worker_url" value="${existing.url}" required class="bg-surface-container border border-surface-variant rounded-md p-sm text-on-surface w-full max-w-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="https://...">
            </div>
            <div class="flex flex-col gap-xs">
                <label class="text-label-sm text-on-surface-variant">Código do Cartão</label>
                <input type="text" id="ru_codigo" value="${existing.codigo}" required class="bg-surface-container border border-surface-variant rounded-md p-sm text-on-surface w-full max-w-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="1234567890">
            </div>
            <div class="flex flex-col gap-xs">
                <label class="text-label-sm text-on-surface-variant">Matrícula</label>
                <input type="text" id="ru_matricula" value="${existing.matricula}" required class="bg-surface-container border border-surface-variant rounded-md p-sm text-on-surface w-full max-w-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="123456">
            </div>
            <div class="mt-sm flex gap-md">
                <button type="submit" class="bg-primary text-on-primary font-medium px-md py-sm rounded-md hover:bg-primary-container transition-colors">Salvar</button>
                ${existing.url ? `<button type="button" onclick="updateRU()" class="text-on-surface-variant hover:text-on-surface transition-colors">Cancelar</button>` : ''}
            </div>
        </form>
    `;
}

window.saveRUConfig = function(event) {
    event.preventDefault();
    const config = {
        url: document.getElementById('ru_worker_url').value.trim(),
        codigo: document.getElementById('ru_codigo').value.trim(),
        matricula: document.getElementById('ru_matricula').value.trim()
    };
    localStorage.setItem('ru_config', JSON.stringify(config));
    // Clear cache because config changed
    localStorage.removeItem('ru_cache');
    updateRU();
}

window.editRUConfig = function() {
    showRUConfigForm();
}

async function updateRU() {
    const container = document.getElementById('ru-content');
    
    const config = getRUConfig();
    if (!config || !config.url || !config.codigo || !config.matricula) {
        showRUConfigForm();
        return;
    }

    container.innerHTML = `<div class="loading text-on-surface-variant italic col-span-1 md:col-span-3">Sincronizando com o servidor da UFC...</div>`;

    const today = new Date().toLocaleDateString('pt-BR');

    // 1. Try to load from Cache
    const cachedData = localStorage.getItem('ru_cache');
    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // If the date is still today, use it and stop!
        if (parsed.date === today) {
            displayResults(parsed.menu, parsed.credits);
            console.log("Loaded RU data from local cache.");
            return;
        }
    }

    // 2. If no cache or old cache, fetch new data
    try {
        const credentials = {
            codigoCartao: config.codigo,
            matriculaAtreladaCartao: config.matricula
        };
        const workerUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;

        const [menuHtml, credHtml] = await Promise.all([
            fetch(`${workerUrl}?type=menu`).then(r => r.text()),
            fetch(`${workerUrl}?type=cred`, {
                method: 'POST',
                body: new URLSearchParams(credentials)
            }).then(r => r.text())
        ]);

        const menu = parseMenu(menuHtml);
        const credits = parseCredits(credHtml);

        // 3. Save to LocalStorage
        const cacheObject = {
            date: today,
            menu: menu,
            credits: credits
        };
        localStorage.setItem('ru_cache', JSON.stringify(cacheObject));

        displayResults(menu, credits);
    } catch (e) {
        container.innerHTML = `
            <div class="loading text-error italic col-span-1 md:col-span-3 mb-md">Erro ao sincronizar: ${e.message}</div>
            <div class="col-span-1 md:col-span-3"><button onclick="editRUConfig()" class="text-xs text-on-surface-variant border border-surface-variant/50 rounded px-3 py-1.5 hover:text-primary transition-colors">Revisar Configurações</button></div>
        `;
    }
}

function parseMenu(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const subMenus = ['principal', 'guarnicao', 'acompanhamento', 'suco', 'sobremesa'];
    let res = "";

    subMenus.forEach(sub => {
        const el = doc.querySelectorAll(`table.refeicao.almoco td.${sub}`);
        if (el.length >= 2) {
            res += `<span class="text-tertiary font-medium">${el[0].textContent.toUpperCase()}</span><br>`;
            el[1].querySelectorAll('span').forEach(s => res += `<span class="text-on-surface-variant">• ${s.textContent}</span><br>`);
            res += `<br>`;
        }
    });
    return res || "Nenhum cardápio disponível hoje.";
}

function parseCredits(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const row = doc.querySelector('table.listagem tbody tr.linhaImpar');
    if (!row) return "N/A";
    const tds = row.querySelectorAll('td');
    return tds.length >= 2 ? tds[1].textContent.trim() : "Erro";
}

function displayResults(menu, credits) {
    const container = document.getElementById('ru-content');
    container.innerHTML = `
        <div class="md:col-span-2 text-on-surface leading-relaxed text-sm">${menu}</div>
        <div class="md:col-span-1 text-primary md:border-l border-surface-variant/20 md:pl-md flex flex-col justify-start">
            <div>
                <strong class="text-on-surface-variant text-xs tracking-widest uppercase">SALDO</strong><br>
                <span class="text-display font-display font-medium text-primary">${credits}</span>
            </div>
            <div class="mt-xl flex flex-col gap-sm items-start">
                <button onclick="clearRUCache()" class="text-xs text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/50 hover:border-primary/50 rounded px-3 py-1.5 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">refresh</span>
                    Atualizar
                </button>
                <button onclick="editRUConfig()" class="text-xs text-on-surface-variant hover:text-primary transition-colors border border-surface-variant/50 hover:border-primary/50 rounded px-3 py-1.5 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">settings</span>
                    Configurar
                </button>
            </div>
        </div>
    `;
}

function clearRUCache() {
    localStorage.removeItem('ru_cache');
    updateRU();
}

// Run RU Update
updateRU();

// Global Keypress Focus
document.addEventListener('keydown', (e) => {
    if (e.target.tagName !== 'INPUT') {
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) searchInput.focus();
    }
});

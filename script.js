function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = `${hours}:${minutes}`;

    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
        //const hour = now.getHours();
        //let greeting = "Boa Noite";
        //if (hour < 12) greeting = "Bom Dia";
        //else if (hour < 18) greeting = "Boa Tarde";
        let greeting = "Hello World";
        greetingEl.textContent = `${greeting}`;
    }

    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = now.getFullYear();
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

window.showSection = function(sectionId) {
    const hero = document.getElementById('hero-section');
    const grid = document.getElementById('grid-section');
    const ru = document.getElementById('ru-section');
    const settings = document.getElementById('settings-section');
    
    const heroEl = hero;
    const gridEl = grid;
    const ruEl = ru;
    const settingsEl = settings;

    // Hide all main sections
    if (heroEl) heroEl.classList.add('hidden');
    if (gridEl) gridEl.classList.add('hidden');
    if (ruEl) ruEl.classList.add('hidden');
    if (settingsEl) settingsEl.classList.add('hidden');

    // Show requested sections
    if (sectionId === 'home') {
        if (heroEl) heroEl.classList.remove('hidden');
        if (gridEl) gridEl.classList.remove('hidden');
    } else if (sectionId === 'links') {
        if (gridEl) gridEl.classList.remove('hidden');
    } else if (sectionId === 'ru') {
        if (ruEl) ruEl.classList.remove('hidden');
    } else if (sectionId === 'settings') {
        if (settingsEl) settingsEl.classList.remove('hidden');
    }

    // Update Top Nav Styling
    ['home', 'links', 'ru', 'settings'].forEach(s => {
        const nav = document.getElementById('nav-' + s);
        if (nav) {
            nav.classList.remove('text-primary', 'border-b-2', 'border-primary', 'pb-1');
            nav.classList.add('text-on-surface-variant');
        }
    });

    const activeNav = document.getElementById('nav-' + sectionId);
    if (activeNav) {
        activeNav.classList.remove('text-on-surface-variant');
        activeNav.classList.add('text-primary', 'border-b-2', 'border-primary', 'pb-1');
    }

    // Update Sidebar States
    ['home', 'settings'].forEach(s => {
        const sidebarLink = document.getElementById('sidebar-' + s);
        if (sidebarLink) {
            if (sectionId === s) {
                sidebarLink.classList.add('bg-secondary-container', 'text-on-secondary-container');
                sidebarLink.classList.remove('text-on-surface-variant');
            } else {
                sidebarLink.classList.remove('bg-secondary-container', 'text-on-secondary-container');
                sidebarLink.classList.add('text-on-surface-variant');
            }
        }
    });
}

// --- LINK LOADING & RENDERING ---

async function initLinks() {
    try {
        // 1. Check LocalStorage
        const customLinks = localStorage.getItem('custom_links');
        if (customLinks) {
            const links = JSON.parse(customLinks);
            renderSidebar(links);
            renderGrid(links);
            console.log("Loaded links from LocalStorage.");
            return;
        }

        // 2. Fallback to links.json
        const response = await fetch('links.json');
        if (!response.ok) throw new Error('Failed to load links.json');
        const links = await response.json();
        
        renderSidebar(links);
        renderGrid(links);
    } catch (e) {
        console.error("Error loading links:", e);
        const gridContainer = document.getElementById('grid-dynamic-links');
        if (gridContainer) {
            gridContainer.innerHTML = `<div class="text-error italic">Erro ao carregar links: ${e.message}</div>`;
        }
    }
}

window.handleLinksUpload = function(event) {
    const file = event.target.files[0];
    const status = document.getElementById('upload-status');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = JSON.parse(e.target.result);
            // Basic validation
            if (!Array.isArray(content)) throw new Error("O arquivo deve ser um array JSON.");
            
            localStorage.setItem('custom_links', JSON.stringify(content));
            status.textContent = "Links atualizados com sucesso!";
            status.className = "text-sm italic text-tertiary";
            
            // Reload UI
            renderSidebar(content);
            renderGrid(content);
        } catch (err) {
            status.textContent = "Erro ao processar arquivo: " + err.message;
            status.className = "text-sm italic text-error";
        }
    };
    reader.readAsText(file);
}

window.clearCustomLinks = function() {
    if (confirm("Tem certeza que deseja resetar seus links? Isso voltará para a configuração padrão.")) {
        localStorage.removeItem('custom_links');
        location.reload(); // Simplest way to revert to default fetch
    }
}

function renderSidebar(links) {
    const container = document.getElementById('sidebar-dynamic-links');
    if (!container) return;

    const groups = [...new Set(links.map(l => l.group))];
    let html = '';

    groups.forEach((group, index) => {
        const groupId = `group-${index}`;
        const groupLinks = links.filter(l => l.group === group);
        
        html += `
            <div class="space-y-xs">
                <button class="w-full flex items-center justify-between text-on-surface-variant px-md py-xs hover:bg-surface-variant hover:text-on-surface rounded-lg transition-all" onclick="toggleMenu('${groupId}')">
                    <span class="font-medium">${group}</span>
                    <span class="material-symbols-outlined text-[18px]" id="${groupId}-icon">expand_more</span>
                </button>
                <div class="ml-[16px] flex flex-col space-y-xs hidden" id="${groupId}">
                    ${groupLinks.map(l => `
                        <a class="text-label-sm py-xs text-on-surface-variant hover:text-primary transition-colors" href="${l.link}" target="_blank" rel="noopener noreferrer">${l.name}</a>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderGrid(links) {
    const container = document.getElementById('grid-dynamic-links');
    if (!container) return;

    const homeLinks = links.filter(l => l.home_link);
    const groups = [...new Set(homeLinks.map(l => l.group))];
    let html = '';

    groups.forEach(group => {
        const groupLinks = homeLinks.filter(l => l.group === group);
        
        html += `
            <div class="space-y-md">
                <h3 class="font-header-cat text-header-cat uppercase tracking-widest text-tertiary border-b border-surface-variant/20 pb-xs mb-sm">${group}</h3>
                <div class="flex flex-col space-y-sm">
                    ${groupLinks.map(l => `
                        <a class="text-on-surface hover:text-primary transition-colors duration-200" href="${l.link}" target="_blank" rel="noopener noreferrer">${l.name}</a>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Initialize
initLinks();
updateClock();
setInterval(updateClock, 1000);
updateRU();

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

// Global Keypress Focus
document.addEventListener('keydown', (e) => {
    if (e.target.tagName !== 'INPUT') {
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) searchInput.focus();
    }
});

// --- DRAG AND DROP ---
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.add('drag-active');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove if we're actually leaving the window
    if (e.relatedTarget === null) {
        document.body.classList.remove('drag-active');
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.remove('drag-active');
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/json" || file.name.endsWith('.json'))) {
        const mockEvent = { target: { files: [file] } };
        window.handleLinksUpload(mockEvent);
        window.showSection('settings');
    }
});

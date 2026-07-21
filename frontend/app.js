const API_URL = '';
let token = localStorage.getItem('token');

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const showRegisterBtn = document.getElementById('show-register');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMsg = document.getElementById('welcome-msg');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const loadingDiv = document.getElementById('loading');
const resultsArea = document.getElementById('results-area');
const resultsContent = document.getElementById('results-content');

let isRegistering = false;

// Check Auth state on load
if (token) {
    checkToken();
}

// Toggle Login / Register
showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        document.querySelector('.logo h2').innerText = 'Criar Conta';
        document.querySelector('.btn-primary').innerText = 'Registrar';
        showRegisterBtn.innerText = 'Já tenho conta';
    } else {
        document.querySelector('.logo h2').innerText = 'SIPSniffer';
        document.querySelector('.btn-primary').innerText = 'Entrar';
        showRegisterBtn.innerText = 'Criar conta';
    }
});

// Login / Register Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    loginError.innerText = '';
    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.innerText = 'Aguarde...';

    try {
        if (isRegistering) {
            const res = await fetch(`${API_URL}/users/?username=${username}&password=${password}`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Usuário já existe ou erro no servidor');
            
            // Auto login after register
            await login(username, password);
        } else {
            await login(username, password);
        }
    } catch (err) {
        loginError.innerText = err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = isRegistering ? 'Registrar' : 'Entrar';
    }
});

async function login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });

    if (!res.ok) throw new Error('Credenciais inválidas');
    
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('token', token);
    
    showDashboard(username);
}

async function checkToken() {
    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            showDashboard(data.username);
        } else {
            logout();
        }
    } catch (e) {
        logout();
    }
}

function showDashboard(username) {
    loginContainer.classList.remove('active');
    setTimeout(() => {
        loginContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
        setTimeout(() => dashboardContainer.classList.add('active'), 50);
    }, 400);
    welcomeMsg.innerText = `Olá, ${username}`;
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    dashboardContainer.classList.remove('active');
    setTimeout(() => {
        dashboardContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        setTimeout(() => loginContainer.classList.add('active'), 50);
    }, 400);
}

logoutBtn.addEventListener('click', logout);

// Drag and Drop Upload
uploadArea.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
});

uploadArea.addEventListener('drop', (e) => {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles(files);
});

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

async function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    
    if (!file.name.endsWith('.pcap') && !file.name.endsWith('.pcapng')) {
        alert('Por favor, envie apenas arquivos .pcap ou .pcapng');
        return;
    }

    uploadArea.classList.add('hidden');
    resultsArea.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/analyze/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await res.json();
        renderResults(data);
    } catch (err) {
        alert('Erro ao enviar arquivo para análise.');
        console.error(err);
    } finally {
        loadingDiv.classList.add('hidden');
        uploadArea.classList.remove('hidden');
    }
}

function renderResults(data) {
    resultsArea.classList.remove('hidden');
    resultsContent.innerHTML = '';

    if (data.status === 'error') {
        resultsContent.innerHTML = `<div class="issue-card"><div class="issue-header"><h4>Erro na Análise</h4></div><div class="issue-details"><p>${data.message}</p></div></div>`;
        return;
    }

    if (data.issues.length === 0) {
        resultsContent.innerHTML = `<div class="success-card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <h4>Nenhum problema encontrado</h4>
            <p>Foram analisadas ${data.total_calls_analyzed} chamadas com sucesso.</p>
        </div>`;
        return;
    }

    let html = `<p style="margin-bottom: 16px; color: var(--text-muted)">Encontramos ${data.issues.length} problema(s) nas ${data.total_calls_analyzed} chamadas analisadas:</p>`;
    
    data.issues.forEach(issue => {
        html += `
        <div class="issue-card">
            <div class="issue-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h4>${issue.issue}</h4>
            </div>
            <div class="issue-details">
                <p>${issue.details}</p>
                <p><strong>Call-ID:</strong> ${issue.call_id}</p>
                <p><strong>IP da Operadora (Origem):</strong> ${issue.provider_ip}</p>
                <p><strong>IP no Request-URI (Destino):</strong> ${issue.invite_uri}</p>
                <p><strong>IP Informado pelo PABX (Contact):</strong> ${issue.contact_header}</p>
                <p><strong>Retransmissões do 200 OK:</strong> ${issue.retransmissions} vezes</p>
            </div>
        </div>`;
    });

    resultsContent.innerHTML = html;
}

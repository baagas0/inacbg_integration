// Complete JavaScript for INACBG Bridging System
const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const loadingModal = document.getElementById('loadingModal');
const loadingText = document.getElementById('loadingText');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeClaimTabs();
    initializeInquiryTabs();
    initializeForms();
    checkAuthStatus();
});

// Tab Navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Claim Tabs
function initializeClaimTabs() {
    const claimTabButtons = document.querySelectorAll('.claim-tab-btn');
    const claimTabContents = document.querySelectorAll('.claim-tab-content');

    claimTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-claim-tab');

            claimTabButtons.forEach(btn => btn.classList.remove('active'));
            claimTabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Inquiry Tabs
function initializeInquiryTabs() {
    const inquiryTabButtons = document.querySelectorAll('.inquiry-tab-btn');
    const inquiryTabContents = document.querySelectorAll('.inquiry-tab-content');

    inquiryTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-inquiry-tab');

            inquiryTabButtons.forEach(btn => btn.classList.remove('active'));
            inquiryTabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Form Initialization
function initializeForms() {
    // Auth Form
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    // Claim Forms
    const newClaimForm = document.getElementById('newClaimForm');
    if (newClaimForm) {
        newClaimForm.addEventListener('submit', handleNewClaimSubmit);
    }

    const updateClaimForm = document.getElementById('updateClaimForm');
    if (updateClaimForm) {
        updateClaimForm.addEventListener('submit', handleUpdateClaimSubmit);
    }

    const deleteClaimForm = document.getElementById('deleteClaimForm');
    if (deleteClaimForm) {
        deleteClaimForm.addEventListener('submit', handleDeleteClaimSubmit);
    }

    const finalClaimForm = document.getElementById('finalClaimForm');
    if (finalClaimForm) {
        finalClaimForm.addEventListener('submit', handleFinalClaimSubmit);
    }

    // Inquiry Forms
    const claimInquiryForm = document.getElementById('claimInquiryForm');
    if (claimInquiryForm) {
        claimInquiryForm.addEventListener('submit', handleClaimInquirySubmit);
    }

    const patientInquiryForm = document.getElementById('patientInquiryForm');
    if (patientInquiryForm) {
        patientInquiryForm.addEventListener('submit', handlePatientInquirySubmit);
    }

    const sepInquiryForm = document.getElementById('sepInquiryForm');
    if (sepInquiryForm) {
        sepInquiryForm.addEventListener('submit', handleSepInquirySubmit);
    }

    // Filter event listeners
    const logMethodFilter = document.getElementById('logMethodFilter');
    const logStatusFilter = document.getElementById('logStatusFilter');
    const logLimit = document.getElementById('logLimit');
    const claimStatusFilter = document.getElementById('claimStatusFilter');
    const claimLimit = document.getElementById('claimLimit');

    [logMethodFilter, logStatusFilter, logLimit].forEach(element => {
        if (element) {
            element.addEventListener('change', loadLogs);
        }
    });

    [claimStatusFilter, claimLimit].forEach(element => {
        if (element) {
            element.addEventListener('change', loadClaims);
        }
    });

    // Modal event listeners
    cancelBtn.addEventListener('click', closeConfirmModal);

    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });

    // Input validation
    setupInputValidation();
}

// Input Validation Setup
function setupInputValidation() {
    // SEP validation
    const sepInputs = document.querySelectorAll('input[name*="nomor_sep"]');
    sepInputs.forEach(input => {
        input.addEventListener('input', validateSepFormat);
    });

    // BPJS card validation
    const kartuInputs = document.querySelectorAll('input[name*="nomor_kartu"]');
    kartuInputs.forEach(input => {
        input.addEventListener('input', validateKartuFormat);
    });

    // JSON textarea validation
    const jsonTextareas = document.querySelectorAll('textarea[name*="diagnosa"], textarea[name*="procedure"], textarea[name*="tarif"]');
    jsonTextareas.forEach(textarea => {
        textarea.addEventListener('blur', validateJsonFormat);
    });

    // JSON formatting with Ctrl+Enter
    jsonTextareas.forEach(textarea => {
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                formatJson(textarea);
            }
        });
    });
}

// Validation Functions
function validateSepFormat(e) {
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
    e.target.value = value;

    if (value.length > 0) {
        if (value.match(/^[A-Z]{1}\d{3}[A-Z]{1}\d{9}$/)) {
            e.target.style.borderColor = '#48bb78';
        } else {
            e.target.style.borderColor = '#ed8936';
        }
    }
}

function validateKartuFormat(e) {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;

    if (value.length > 0) {
        if (value.length === 13) {
            e.target.style.borderColor = '#48bb78';
        } else {
            e.target.style.borderColor = '#ed8936';
        }
    }
}

function validateJsonFormat(e) {
    const textarea = e.target;
    const value = textarea.value.trim();

    if (value) {
        try {
            JSON.parse(value);
            textarea.style.borderColor = '#48bb78';
            return true;
        } catch (error) {
            textarea.style.borderColor = '#f56565';
            return false;
        }
    }

    textarea.style.borderColor = '#e2e8f0';
    return true;
}

function formatJson(textarea) {
    const value = textarea.value.trim();
    if (value) {
        try {
            const json = JSON.parse(value);
            textarea.value = JSON.stringify(json, null, 2);
            textarea.style.borderColor = '#48bb78';
        } catch (error) {
            // Keep current value if invalid JSON
        }
    }
}

// API Call Functions
async function makeApiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Authentication Functions
async function handleAuthSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        encryption_key: formData.get('encryption_key')
    };

    showLoading('Menyimpan encryption key...');
    showStatus('authStatus', 'info', 'Menyimpan encryption key...');

    try {
        const result = await makeApiCall('/auth/set-key', 'POST', data);
        showStatus('authStatus', 'success', result.message);
        e.target.reset();
    } catch (error) {
        showStatus('authStatus', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function checkAuthStatus() {
    try {
        const result = await makeApiCall('/auth/status');
        const authStatus = document.getElementById('authStatus');

        if (result.has_key) {
            showStatus('authStatus', 'success', 'Encryption key sudah tersimpan');
        }
    } catch (error) {
        // Silent fail - auth check is optional
    }
}

// Claim Functions
async function handleNewClaimSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Parse JSON fields
    const jsonFields = ['diagnosa', 'procedure', 'tarif'];
    for (const field of jsonFields) {
        if (data[field]) {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (error) {
                showStatus('newClaimStatus', 'error', `Format JSON tidak valid di field ${field}: ${error.message}`);
                return;
            }
        }
    }

    showLoading('Mengajukan klaim baru...');
    showStatus('newClaimStatus', 'info', 'Mengajukan klaim baru...');

    try {
        const result = await makeApiCall('/inacbg/new-claim', 'POST', data);
        showStatus('newClaimStatus', 'success', `Klaim berhasil diajukan! ID: ${result.local_claim_id}`);
        e.target.reset();
        loadLogs();
    } catch (error) {
        showStatus('newClaimStatus', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handleUpdateClaimSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nomor_sep = formData.get('nomor_sep');

    try {
        const update_data = JSON.parse(formData.get('update_data'));
        const data = { nomor_sep, ...update_data };

        showLoading('Mengupdate klaim...');
        showStatus('updateClaimStatus', 'info', 'Mengupdate klaim...');

        const result = await makeApiCall('/inacbg/update-claim', 'PUT', data);
        showStatus('updateClaimStatus', 'success', 'Klaim berhasil diupdate');
        e.target.reset();
        loadLogs();
    } catch (error) {
        showStatus('updateClaimStatus', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handleDeleteClaimSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nomor_sep = formData.get('nomor_sep');

    const confirmed = await showConfirmModal(
        'Konfirmasi Hapus Klaim',
        `Apakah Anda yakin ingin menghapus klaim dengan nomor SEP: ${nomor_sep}?`
    );

    if (!confirmed) return;

    showLoading('Menghapus klaim...');
    showStatus('deleteClaimStatus', 'info', 'Menghapus klaim...');

    try {
        const result = await makeApiCall('/inacbg/delete-claim', 'DELETE', { nomor_sep });
        showStatus('deleteClaimStatus', 'success', 'Klaim berhasil dihapus');
        e.target.reset();
        loadLogs();
    } catch (error) {
        showStatus('deleteClaimStatus', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handleFinalClaimSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const nomor_sep = formData.get('nomor_sep');
    const final_action = formData.get('final_action');

    const endpoint = final_action === 'set' ? '/inacbg/set-claim-final' : '/inacbg/unset-claim-final';
    const actionText = final_action === 'set' ? 'finalisasi' : 'batal finalisasi';

    showLoading(`Melakukan ${actionText} klaim...`);
    showStatus('finalClaimStatus', 'info', `Melakukan ${actionText} klaim...`);

    try {
        const result = await makeApiCall(endpoint, 'POST', { nomor_sep });
        showStatus('finalClaimStatus', 'success', `Klaim berhasil di-${actionText}`);
        e.target.reset();
        loadLogs();
    } catch (error) {
        showStatus('finalClaimStatus', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Inquiry Functions
async function handleClaimInquirySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Filter empty values
    Object.keys(data).forEach(key => {
        if (!data[key]) delete data[key];
    });

    if (Object.keys(data).length === 0) {
        showStatus('claimInquiryResult', 'error', 'Masukkan minimal satu parameter pencarian');
        return;
    }

    showLoading('Mencari data klaim...');
    showStatus('claimInquiryResult', 'info', 'Mencari data klaim...');

    try {
        const result = await makeApiCall('/inacbg/inquiry/claim-data', 'POST', data);
        displayInquiryResult('claimInquiryResult', result.inacbg_response);
    } catch (error) {
        showStatus('claimInquiryResult', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handlePatientInquirySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    Object.keys(data).forEach(key => {
        if (!data[key]) delete data[key];
    });

    if (Object.keys(data).length === 0) {
        showStatus('patientInquiryResult', 'error', 'Masukkan minimal satu parameter pencarian');
        return;
    }

    showLoading('Mencari data pasien...');
    showStatus('patientInquiryResult', 'info', 'Mencari data pasien...');

    try {
        const result = await makeApiCall('/inacbg/inquiry/patient-data', 'POST', data);
        displayInquiryResult('patientInquiryResult', result.inacbg_response);
    } catch (error) {
        showStatus('patientInquiryResult', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function handleSepInquirySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    Object.keys(data).forEach(key => {
        if (!data[key]) delete data[key];
    });

    if (Object.keys(data).length === 0) {
        showStatus('sepInquiryResult', 'error', 'Masukkan minimal satu parameter pencarian');
        return;
    }

    showLoading('Mencari data SEP...');
    showStatus('sepInquiryResult', 'info', 'Mencari data SEP...');

    try {
        const result = await makeApiCall('/inacbg/inquiry/sep-data', 'POST', data);
        displayInquiryResult('sepInquiryResult', result.inacbg_response);
    } catch (error) {
        showStatus('sepInquiryResult', 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Display Functions
function displayInquiryResult(elementId, data) {
    const container = document.getElementById(elementId);

    let html = '<div class="inquiry-result">';
    html += '<h4>🔍 Hasil Pencarian</h4>';
    html += '<div class="inquiry-data">';
    html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
}

// Monitoring Functions
async function loadLogs() {
    try {
        const method = document.getElementById('logMethodFilter')?.value;
        const status = document.getElementById('logStatusFilter')?.value;
        const limit = document.getElementById('logLimit')?.value || 50;

        const params = new URLSearchParams();
        if (method) params.append('method', method);
        if (status) params.append('status', status);
        params.append('limit', limit);

        const logs = await makeApiCall(`/logs?${params}`);
        displayLogs(logs);
    } catch (error) {
        const container = document.getElementById('logsContainer');
        container.innerHTML = `<p>Error loading logs: ${error.message}</p>`;
    }
}

async function loadClaims() {
    try {
        const status = document.getElementById('claimStatusFilter')?.value;
        const limit = document.getElementById('claimLimit')?.value || 50;

        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('limit', limit);

        const claims = await makeApiCall(`/claims?${params}`);
        displayClaims(claims);
    } catch (error) {
        const container = document.getElementById('claimsContainer');
        container.innerHTML = `<p>Error loading claims: ${error.message}</p>`;
    }
}

function displayLogs(logs) {
    const container = document.getElementById('logsContainer');

    if (logs.length === 0) {
        container.innerHTML = '<p>Belum ada log tersedia.</p>';
        return;
    }

    const html = logs.map(log => {
        const statusClass = log.is_success ? 'success' : 'error';
        const timestamp = new Date(log.logged_at).toLocaleString('id-ID');

        return `
            <div class="log-entry ${statusClass}">
                <div class="log-timestamp">${timestamp}</div>
                <div>
                    <span class="log-method">${log.method.toUpperCase()}</span>
                    -
                    <span class="log-status">${log.is_success ? 'SUCCESS' : 'ERROR'}</span>
                    -
                    Status: ${log.response_status}
                </div>
                ${log.response_data ? `
                    <div class="log-response">
                        <strong>Response:</strong><br>
                        <pre>${JSON.stringify(log.response_data, null, 2)}</pre>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function displayClaims(claims) {
    const container = document.getElementById('claimsContainer');

    if (claims.length === 0) {
        container.innerHTML = '<p>Belum ada klaim tersedia.</p>';
        return;
    }

    const html = claims.map(claim => {
        const timestamp = new Date(claim.createdAt).toLocaleString('id-ID');
        const statusClass = getStatusClass(claim.status_klaim);

        return `
            <div class="claim-entry">
                <h4>📋 Klaim: ${claim.nomor_sep}</h4>
                <div class="claim-meta">
                    <span><strong>Nama:</strong> ${claim.nama_pasien || '-'}</span>
                    <span><strong>Kartu:</strong> ${claim.nomor_kartu || '-'}</span>
                    <span><strong>Dibuat:</strong> ${timestamp}</span>
                </div>
                <div class="claim-meta">
                    <span class="claim-status ${statusClass}">${claim.status_klaim}</span>
                    <span><strong>Method:</strong> ${claim.last_inacbg_method || '-'}</span>
                </div>
                ${claim.error_message ? `<div class="text-danger"><strong>Error:</strong> ${claim.error_message}</div>` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function getStatusClass(status) {
    if (status.includes('SUCCESS') || status.includes('FINAL')) return 'success';
    if (status.includes('FAILED') || status.includes('ERROR')) return 'error';
    if (status.includes('PENDING')) return 'pending';
    return 'info';
}

// Utility Functions
function showLoading(text = 'Sedang memproses...') {
    loadingText.textContent = text;
    loadingModal.style.display = 'block';
}

function hideLoading() {
    loadingModal.style.display = 'none';
}

function showStatus(elementId, type, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.className = `status-message ${type}`;
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideStatus(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmModal.style.display = 'block';

        const handleConfirm = () => {
            closeConfirmModal();
            resolve(true);
        };

        const handleCancel = () => {
            closeConfirmModal();
            resolve(false);
        };

        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
    });
}

function closeConfirmModal() {
    confirmModal.style.display = 'none';
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;
}

// Clear Form Functions
function clearNewClaimForm() {
    const form = document.getElementById('newClaimForm');
    if (form) {
        form.reset();
        hideStatus('newClaimStatus');
    }
}

function clearUpdateClaimForm() {
    const form = document.getElementById('updateClaimForm');
    if (form) {
        form.reset();
        hideStatus('updateClaimStatus');
    }
}

function clearDeleteClaimForm() {
    const form = document.getElementById('deleteClaimForm');
    if (form) {
        form.reset();
        hideStatus('deleteClaimStatus');
    }
}

function clearFinalClaimForm() {
    const form = document.getElementById('finalClaimForm');
    if (form) {
        form.reset();
        hideStatus('finalClaimStatus');
    }
}

function clearClaimInquiryForm() {
    const form = document.getElementById('claimInquiryForm');
    if (form) {
        form.reset();
        hideStatus('claimInquiryResult');
    }
}

function clearPatientInquiryForm() {
    const form = document.getElementById('patientInquiryForm');
    if (form) {
        form.reset();
        hideStatus('patientInquiryResult');
    }
}

function clearSepInquiryForm() {
    const form = document.getElementById('sepInquiryForm');
    if (form) {
        form.reset();
        hideStatus('sepInquiryResult');
    }
}

function clearDisplay() {
    document.getElementById('logsContainer').innerHTML = '<p>Log telah dihapus dari tampilan.</p>';
    document.getElementById('claimsContainer').innerHTML = '<p>Data klaim telah dihapus dari tampilan.</p>';
}

// Template Functions
function loadClaimTemplate() {
    const template = {
        nomor_sep: "0001R0011123000001",
        nomor_rm: "RM001234",
        nama_pasien: "John Doe",
        tanggal_lahir: "1980-01-01",
        nomor_kartu: "0001234567890",
        kode_provider: "P0012345",
        nama_provider: "RS Sehat Indonesia",
        kelas_rawat: "1",
        dpjp: "Dr. Smith",
        tanggal_masuk: "2024-01-15",
        tanggal_keluar: "2024-01-20",
        jenis_rawat: "1",
        cara_bayar: "1",
        diagnosa: [
            { kode: "A00", nama: "Kolera" },
            { kode: "A01", nama: "Demam Tifoid" }
        ],
        procedure: [
            { kode: "81.51", nama: "Operasi Usus Buntu" }
        ],
        tarif: {
            tarif_pelayanan: 5000000,
            tarif_obat: 1000000,
            tarif_alkes: 500000,
            total_tarif: 6500000
        }
    };

    // Fill form with template data
    Object.keys(template).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            if (typeof template[key] === 'object') {
                input.value = JSON.stringify(template[key], null, 2);
            } else {
                input.value = template[key];
            }
        }
    });

    showStatus('newClaimStatus', 'info', 'Template data telah dimuat. Silakan sesuaikan dengan data yang dibutuhkan.');
}
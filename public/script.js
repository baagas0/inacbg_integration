// API Base URL
const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const authForm = document.getElementById('authForm');
const claimForm = document.getElementById('claimForm');
const authStatus = document.getElementById('authStatus');
const claimStatus = document.getElementById('claimStatus');
const logsContainer = document.getElementById('logsContainer');
const loadingModal = document.getElementById('loadingModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadLogs();
    checkAuthStatus();
});

// Authentication Form Handler
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(authForm);
    const data = {
        encryption_key: formData.get('encryption_key')
    };

    showLoading();
    showStatus(authStatus, 'info', 'Menyimpan encryption key...');

    try {
        const response = await fetch(`${API_BASE}/auth/set-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(authStatus, 'success', result.message);
            authForm.reset();
        } else {
            showStatus(authStatus, 'error', result.message || 'Gagal menyimpan encryption key');
        }
    } catch (error) {
        showStatus(authStatus, 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
});

// Claim Form Handler
claimForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(claimForm);

    // Parse data_provider JSON
    let dataProvider;
    try {
        const dataProviderText = formData.get('data_provider');
        if (!dataProviderText.trim()) {
            throw new Error('Data provider tidak boleh kosong');
        }
        dataProvider = JSON.parse(dataProviderText);
    } catch (error) {
        showStatus(claimStatus, 'error', `Format JSON tidak valid: ${error.message}`);
        return;
    }

    const data = {
        nomor_sep: formData.get('nomor_sep'),
        nomor_kartu: formData.get('nomor_kartu'),
        nama_pasien: formData.get('nama_pasien'),
        data_klaim: dataProvider
    };

    showLoading();
    showStatus(claimStatus, 'info', 'Mengajukan klaim baru...');

    try {
        const response = await fetch(`${API_BASE}/inacbg/new-claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus(claimStatus, 'success',
                `Klaim berhasil diajukan! ID: ${result.local_claim_id}`);
            claimForm.reset();
            loadLogs(); // Refresh logs after successful submission
        } else {
            showStatus(claimStatus, 'error', result.message || 'Gagal mengajukan klaim');
        }
    } catch (error) {
        showStatus(claimStatus, 'error', `Error: ${error.message}`);
    } finally {
        hideLoading();
    }
});

// Load API Logs
async function loadLogs() {
    try {
        const response = await fetch(`${API_BASE}/logs`);
        const logs = await response.json();

        if (logs.length === 0) {
            logsContainer.innerHTML = '<p>Belum ada log tersedia.</p>';
            return;
        }

        logsContainer.innerHTML = logs.map(log => {
            const statusClass = log.status === 'success' ? 'success' :
                               log.status === 'error' ? 'error' : 'pending';

            return `
                <div class="log-entry ${statusClass}">
                    <div class="log-timestamp">
                        ${formatDate(log.logged_at)}
                    </div>
                    <div>
                        <span class="log-method">${log.method.toUpperCase()}</span>
                        -
                        <span class="log-status">${log.status.toUpperCase()}</span>
                    </div>
                    <div class="log-response">
                        <strong>Response:</strong><br>
                        <pre>${JSON.stringify(log.response_data, null, 2)}</pre>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        logsContainer.innerHTML = `<p>Error loading logs: ${error.message}</p>`;
    }
}

// Clear form
function clearForm() {
    claimForm.reset();
    hideStatus(claimStatus);
}

// Clear logs display
function clearLogs() {
    logsContainer.innerHTML = '<p>Log telah dihapus dari tampilan.</p>';
}

// Show loading modal
function showLoading() {
    loadingModal.style.display = 'block';
}

// Hide loading modal
function hideLoading() {
    loadingModal.style.display = 'none';
}

// Show status message
function showStatus(element, type, message) {
    element.className = `status-message ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

// Hide status message
function hideStatus(element) {
    element.style.display = 'none';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/status`);
        if (response.ok) {
            const result = await response.json();
            if (result.has_key) {
                showStatus(authStatus, 'success', 'Encryption key sudah tersimpan');
            }
        }
    } catch (error) {
        // Silent fail - authentication status check is optional
    }
}

// JSON Validation for data_provider textarea
document.getElementById('dataProvider').addEventListener('blur', function() {
    try {
        const value = this.value.trim();
        if (value) {
            JSON.parse(value);
            this.style.borderColor = '#48bb78';
        }
    } catch (error) {
        this.style.borderColor = '#f56565';
    }
});

// Format JSON on Ctrl+Enter in textarea
document.getElementById('dataProvider').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        try {
            const value = this.value.trim();
            if (value) {
                const json = JSON.parse(value);
                this.value = JSON.stringify(json, null, 2);
                this.style.borderColor = '#48bb78';
            }
        } catch (error) {
            // Keep current value if invalid JSON
        }
    }
});

// Auto-format SEP input
document.getElementById('nomorSep').addEventListener('input', function(e) {
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
    if (value.length > 0) {
        // Add formatting for SEP number (basic validation)
        if (!value.match(/^[A-Z]{1}\d{3}[A-Z]{1}\d{9}$/)) {
            // Don't enforce strict format, but provide visual feedback
            this.style.borderColor = '#ed8936';
        } else {
            this.style.borderColor = '#48bb78';
        }
    }
});

// Auto-format BPJS card number
document.getElementById('nomorKartu').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value;

    if (value.length > 0) {
        if (value.length !== 13) {
            this.style.borderColor = '#ed8936';
        } else {
            this.style.borderColor = '#48bb78';
        }
    }
});
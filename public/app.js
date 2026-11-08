// API Base URL
const API_URL = window.location.origin + '/api';

// DOM Elements
const reminderForm = document.getElementById('reminder-form');
const reminderList = document.getElementById('reminder-list');
const alertContainer = document.getElementById('alert-container');
const submitBtn = document.getElementById('submitBtn');
const sendImmediateCheckbox = document.getElementById('sendImmediate');
const testEmailBtn = document.getElementById('testEmailBtn');
const testEmailInput = document.getElementById('testEmail');
const isRecurringCheckbox = document.getElementById('isRecurring');
const recurringOptions = document.getElementById('recurringOptions');
const recurringTypeSelect = document.getElementById('recurringType');
const customDaysGroup = document.getElementById('customDaysGroup');
const dayButtons = document.querySelectorAll('.day-btn');

// State
let reminders = [];
let selectedDays = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadReminders();
    setupEventListeners();
    setDefaultDates();
});

// Setup event listeners
function setupEventListeners() {
    reminderForm.addEventListener('submit', handleSubmit);
    testEmailBtn.addEventListener('click', handleTestEmail);
    
    // Update submit button text based on checkbox
    sendImmediateCheckbox.addEventListener('change', (e) => {
        submitBtn.textContent = e.target.checked ? '📧 Kirim Email Sekarang' : '💾 Simpan & Jadwalkan';
    });

    // Recurring checkbox
    isRecurringCheckbox.addEventListener('change', (e) => {
        recurringOptions.classList.toggle('active', e.target.checked);
        if (e.target.checked) {
            document.getElementById('reminderTime').parentElement.style.display = 'none';
        } else {
            document.getElementById('reminderTime').parentElement.style.display = 'block';
        }
    });

    // Recurring type change
    recurringTypeSelect.addEventListener('change', (e) => {
        customDaysGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Day selector buttons
    dayButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const day = parseInt(btn.dataset.day);
            
            if (selectedDays.includes(day)) {
                selectedDays = selectedDays.filter(d => d !== day);
                btn.classList.remove('selected');
            } else {
                selectedDays.push(day);
                btn.classList.add('selected');
            }
        });
    });
}

// Set default dates (deadline: 7 days from now, reminder: 1 day before)
function setDefaultDates() {
    const now = new Date();
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const reminder = new Date(deadline.getTime() - 24 * 60 * 60 * 1000); // 1 day before
    
    document.getElementById('deadline').value = formatDateTimeLocal(deadline);
    document.getElementById('reminderTime').value = formatDateTimeLocal(reminder);
}

// Format date for datetime-local input
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Show alert message
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Clear alert
function clearAlert() {
    alertContainer.innerHTML = '';
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const vendorName = document.getElementById('vendorName').value.trim();
    const vendorEmail = document.getElementById('vendorEmail').value.trim();
    const projectName = document.getElementById('projectName').value.trim();
    const deadline = document.getElementById('deadline').value;
    const reminderTime = document.getElementById('reminderTime').value;
    const notes = document.getElementById('notes').value.trim();
    const sendImmediate = sendImmediateCheckbox.checked;
    const isRecurring = isRecurringCheckbox.checked;
    
    // Validate
    if (!vendorName || !vendorEmail || !projectName || !deadline) {
        showAlert('❌ Semua field wajib harus diisi', 'error');
        return;
    }
    
    if (!isRecurring && !reminderTime) {
        showAlert('❌ Waktu reminder harus diisi', 'error');
        return;
    }
    
    if (isRecurring && recurringTypeSelect.value === 'custom' && selectedDays.length === 0) {
        showAlert('❌ Pilih minimal satu hari untuk reminder berulang', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Memproses...';
    
    try {
        const payload = {
            vendorName,
            vendorEmail,
            projectName,
            deadline,
            reminderTime,
            notes,
            sendImmediate,
            isRecurring
        };
        
        if (isRecurring) {
            payload.recurringType = recurringTypeSelect.value;
            payload.recurringTime = document.getElementById('recurringTime').value;
            
            if (recurringTypeSelect.value === 'custom') {
                payload.selectedDays = selectedDays;
            }
        }
        
        const response = await fetch(`${API_URL}/reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            const message = sendImmediate 
                ? '✅ Email reminder berhasil dikirim!' 
                : isRecurring
                    ? `✅ Reminder berulang berhasil dijadwalkan! (${data.totalSchedules || 0} jadwal)`
                    : '✅ Reminder berhasil dijadwalkan!';
            showAlert(message, 'success');
            
            // Reset form
            reminderForm.reset();
            setDefaultDates();
            sendImmediateCheckbox.checked = false;
            isRecurringCheckbox.checked = false;
            recurringOptions.classList.remove('active');
            selectedDays = [];
            dayButtons.forEach(btn => btn.classList.remove('selected'));
            submitBtn.textContent = '💾 Simpan & Jadwalkan';
            
            // Reload reminders
            loadReminders();
        } else {
            showAlert(`❌ ${data.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        showAlert('❌ Terjadi kesalahan. Pastikan server berjalan.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 Simpan & Jadwalkan';
    }
}

// Load reminders from server
async function loadReminders() {
    try {
        const response = await fetch(`${API_URL}/reminders`);
        const data = await response.json();
        
        if (data.success) {
            reminders = data.data;
            renderReminders();
        }
    } catch (error) {
        console.error('Load error:', error);
        reminderList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Gagal memuat data</p>
                <p style="font-size: 0.75rem; margin-top: 0.5rem;">Pastikan server berjalan dengan benar</p>
            </div>
        `;
    }
}

// Render reminders list
function renderReminders() {
    if (reminders.length === 0) {
        reminderList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>Belum ada reminder</p>
                <p style="font-size: 0.75rem; margin-top: 0.5rem;">Reminder yang Anda buat akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    reminderList.innerHTML = reminders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(reminder => `
            <div class="reminder-item">
                <div class="reminder-header">
                    <div>
                        <div class="reminder-title">${escapeHtml(reminder.projectName)}</div>
                        <div style="font-size: 0.75rem; color: var(--muted);">
                            ${escapeHtml(reminder.vendorName)} &lt;${escapeHtml(reminder.vendorEmail)}&gt;
                        </div>
                    </div>
                    <span class="reminder-status status-${reminder.status}">
                        ${getStatusLabel(reminder.status)}
                    </span>
                </div>
                <div class="reminder-details">
                    <div class="reminder-detail">
                        <strong>📅 Deadline:</strong>
                        <span>${formatDate(reminder.deadline)}</span>
                    </div>
                    <div class="reminder-detail">
                        <strong>⏰ Reminder:</strong>
                        <span>${formatDate(reminder.reminderTime)}${reminder.isRecurring ? ' 🔄' : ''}</span>
                    </div>
                    ${reminder.isRecurring ? `
                        <div class="reminder-detail">
                            <strong>🔁 Tipe:</strong>
                            <span>${getRecurringLabel(reminder.recurringType)}</span>
                        </div>
                    ` : ''}
                    ${reminder.notes ? `
                        <div class="reminder-detail">
                            <strong>📝 Catatan:</strong>
                            <span>${escapeHtml(reminder.notes)}</span>
                        </div>
                    ` : ''}
                </div>
                ${reminder.status !== 'sent' ? `
                    <div style="margin-top: 0.75rem; text-align: right;">
                        <button 
                            class="btn btn-destructive btn-sm" 
                            onclick="deleteReminder(${reminder.id})"
                        >
                            🗑️ Hapus
                        </button>
                    </div>
                ` : ''}
            </div>
        `)
        .join('');
}

// Delete reminder
async function deleteReminder(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus reminder ini?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reminders/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('✅ Reminder berhasil dihapus', 'success');
            loadReminders();
        } else {
            showAlert(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('❌ Gagal menghapus reminder', 'error');
    }
}

// Handle test email
async function handleTestEmail() {
    const email = testEmailInput.value.trim();
    
    if (!email) {
        showAlert('❌ Masukkan alamat email untuk test', 'error');
        return;
    }
    
    testEmailBtn.disabled = true;
    testEmailBtn.innerHTML = '<span class="loading"></span> Mengirim...';
    
    try {
        const response = await fetch(`${API_URL}/test-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('✅ Test email berhasil dikirim! Cek inbox Anda.', 'success');
            testEmailInput.value = '';
        } else {
            showAlert(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Test email error:', error);
        showAlert('❌ Gagal mengirim test email. Pastikan server berjalan.', 'error');
    } finally {
        testEmailBtn.disabled = false;
        testEmailBtn.innerHTML = 'Kirim Test';
    }
}

// Helper: Format date to Indonesian locale
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper: Get status label
function getStatusLabel(status) {
    const labels = {
        pending: '⏳ Menunggu',
        scheduled: '📅 Terjadwal',
        sent: '✅ Terkirim',
        failed: '❌ Gagal'
    };
    return labels[status] || status;
}

// Helper: Get recurring type label
function getRecurringLabel(type) {
    const labels = {
        daily: 'Setiap Hari',
        weekly: 'Setiap Minggu',
        custom: 'Hari Tertentu'
    };
    return labels[type] || type;
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

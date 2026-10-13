/**
 * Belajar AI - Client Application Logic
 * Menangani interaksi UI, Markdown rendering, auto-resize input,
 * IME-safe submission, dan komunikasi asinkron (fetch) ke backend api.php.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chatViewport = document.getElementById('chatViewport');
  const chatContainer = document.getElementById('chatContainer');
  const welcomeHero = document.getElementById('welcomeHero');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const infoBtn = document.getElementById('infoBtn');
  const infoModal = document.getElementById('infoModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const toastAlert = document.getElementById('toastAlert');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let chatHistory = [];
  let isGenerating = false;
  let currentAbortController = null;

  // Format Waktu Sekarang (HH:MM)
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // Tampilkan Notifikasi Toast
  function showToast(message, duration = 3000) {
    if (!toastAlert || !toastMessage) return;
    toastMessage.textContent = message;
    toastAlert.classList.add('show');
    setTimeout(() => {
      toastAlert.classList.remove('show');
    }, duration);
  }

  // Scroll otomatis ke dasar obrolan
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatViewport.scrollTo({
        top: chatViewport.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  // Escape HTML untuk mencegah XSS
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Safe & Lightweight Markdown Parser
  function parseMarkdown(rawText) {
    if (!rawText) return '';

    // Pisahkan kode blok fenced terlebih dahulu agar tidak terpengaruh format inline
    const codeBlocks = [];
    let text = rawText.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: lang || 'code', code: code.trim() });
      return id;
    });

    // Escape HTML teks biasa
    text = escapeHtml(text);

    // Blockquotes (> kutipan)
    text = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    // Headers (### Teks)
    text = text.replace(/^###\s*(.+)$/gm, '<h4 style="font-weight:700; margin: 0.5rem 0; color:#c7d2fe;">$1</h4>');
    text = text.replace(/^##\s*(.+)$/gm, '<h3 style="font-weight:700; margin: 0.6rem 0; color:#e0e7ff;">$1</h3>');
    text = text.replace(/^#\s*(.+)$/gm, '<h2 style="font-weight:800; margin: 0.75rem 0; color:#ffffff;">$1</h2>');

    // Bold (**text** atau __text__)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic (*text* atau _text_)
    text = text.replace(/(^|[^\*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<em>$2</em>');
    text = text.replace(/(^|[^_])_(?!_)(.*?)(?!_)_/g, '$1<em>$2</em>');

    // Inline Code (`kode`)
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Unordered List (- item atau * item)
    text = text.replace(/^\s*[\-\*]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Numbered List (1. item)
    text = text.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Paragraf dan baris baru
    text = text.split('\n\n').map(paragraph => {
      if (paragraph.startsWith('<ul') || paragraph.startsWith('<blockquote') || paragraph.startsWith('<h') || paragraph.includes('__CODE_BLOCK_')) {
        return paragraph;
      }
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // Kembalikan code blocks dengan markup aman dan tombol salin
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const escapedCode = escapeHtml(block.code);
      const codeHtml = `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${escapeHtml(block.lang)}</span>
            <button class="code-copy-btn" onclick="copyToClipboard(this, \`${escapeForInlineScript(block.code)}\`)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>Salin</span>
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
      text = text.replace(placeholder, codeHtml);
    });

    return text;
  }

  // Escape string khusus untuk fungsi onclick inline
  function escapeForInlineScript(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
  }

  // Global helper fungsi salin ke clipboard
  window.copyToClipboard = function(btnElement, text) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style="color:#10b981">Tersalin!</span>
      `;
      setTimeout(() => {
        btnElement.innerHTML = originalHtml;
      }, 2000);
    }).catch(err => {
      showToast('Gagal menyalin teks ke clipboard');
    });
  };

  // Tambahkan gelembung pesan pengguna ke DOM
  function appendUserMessage(text, time) {
    if (welcomeHero) welcomeHero.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'message-row user';
    row.innerHTML = `
      <div class="avatar user-avatar" title="Anda">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="message-bubble">
          <p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>
        </div>
        <div class="message-meta">
          <span>${time}</span>
        </div>
      </div>
    `;

    chatContainer.appendChild(row);
    scrollToBottom();
  }

  // Hentikan / Batalkan proses pembuatan respon
  function abortGeneration() {
    if (isGenerating && currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  }

  // Tampilkan indikator animasi saat AI sedang berpikir
  function showThinkingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.id = 'thinkingIndicator';
    row.innerHTML = `
      <div class="avatar ai-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="message-bubble thinking-bubble">
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
          <span class="thinking-text">Mohon tunggu sebentar....</span>
        </div>
      </div>
    `;

    chatContainer.appendChild(row);
    scrollToBottom();
  }

  // Tampilkan pesan pembatalan saat user menekan stop/batal
  function appendCancelledMessage() {
    removeThinkingIndicator();

    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.innerHTML = `
      <div class="avatar ai-avatar" style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted); box-shadow: none;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="5" y="5" rx="2" ry="2"/>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="message-bubble" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); color: var(--text-muted); font-style: italic; padding: 0.65rem 1rem;">
          Pertanyaan dibatalkan oleh pengguna.
        </div>
      </div>
    `;

    chatContainer.appendChild(row);
    scrollToBottom();
  }

  // Hapus indikator berpikir
  function removeThinkingIndicator() {
    const indicator = document.getElementById('thinkingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Tambahkan gelembung pesan AI ke DOM
  function appendAIMessage(rawText, time, modelName = 'Gemini') {
    removeThinkingIndicator();

    const row = document.createElement('div');
    row.className = 'message-row ai';

    const parsedContent = parseMarkdown(rawText);

    row.innerHTML = `
      <div class="avatar ai-avatar" title="${escapeHtml(modelName)}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="message-bubble">
          ${parsedContent}
        </div>
        <div class="message-meta">
          <span>${time} • ${escapeHtml(modelName)}</span>
          <button class="btn-copy-msg" onclick="copyToClipboard(this, \`${escapeForInlineScript(rawText)}\`)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>Salin</span>
          </button>
        </div>
      </div>
    `;

    chatContainer.appendChild(row);
    scrollToBottom();
  }

  // Tampilkan pesan error jika request gagal
  function appendErrorMessage(errorText) {
    removeThinkingIndicator();

    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.innerHTML = `
      <div class="avatar ai-avatar" style="background: linear-gradient(135deg, #ef4444, #b91c1c);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="message-bubble" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
          <strong style="color: #fca5a5;">Terjadi Kendala:</strong>
          <p style="color: #fecaca; margin-top: 0.35rem;">${escapeHtml(errorText)}</p>
        </div>
      </div>
    `;

    chatContainer.appendChild(row);
    scrollToBottom();
  }

  // Kirim pesan ke Backend API (api.php)
  async function sendMessage(messageText) {
    const text = messageText.trim();
    if (!text || isGenerating) return;

    isGenerating = true;
    currentAbortController = new AbortController();
    updateSendButtonState(true);

    const currentTime = getCurrentTime();

    // 1. Tambahkan ke tampilan pengguna
    appendUserMessage(text, currentTime);

    // 2. Tampilkan indikator berpikir
    showThinkingIndicator();

    // 3. Reset input textarea
    chatInput.value = '';
    adjustTextareaHeight();

    try {
      // 4. Request ke backend terpisah (api.php) dengan sinyal AbortController
      const API_URL = (window.location.origin.includes('5500') || window.location.protocol === 'file:')
        ? 'http://localhost/belajar-ai/api.php'
        : 'api.php';

      // Request ke backend terpisah (api.php) dengan sinyal AbortController
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: chatHistory
        }),
        signal: currentAbortController.signal
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Simpan ke riwayat sesi untuk multi-turn chat
        chatHistory.push({ role: 'user', text: text });
        chatHistory.push({ role: 'model', text: data.reply });

        // Tampilkan jawaban AI
        appendAIMessage(data.reply, data.timestamp || getCurrentTime(), data.model || 'Gemini 3.8 Flash');
      } else {
        const errorMsg = data.error || 'Gagal menerima tanggapan dari server.';
        appendErrorMessage(errorMsg);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        appendCancelledMessage();
        showToast('Pertanyaan berhasil dibatalkan.');
      } else {
        appendErrorMessage('Tidak dapat terhubung ke server backend (api.php). Pastikan Apache di XAMPP sedang berjalan.');
      }
    } finally {
      isGenerating = false;
      currentAbortController = null;
      updateSendButtonState(false);
      chatInput.focus();
    }
  }

  // Update Status Tombol Kirim / Stop
  function updateSendButtonState(loading) {
    if (loading) {
      sendBtn.disabled = false;
      sendBtn.classList.add('stop-mode');
      sendBtn.setAttribute('title', 'Hentikan / Batalkan respon');
      sendBtn.setAttribute('aria-label', 'Hentikan / Batalkan respon');
      sendBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <rect width="14" height="14" x="5" y="5" rx="3" ry="3"/>
        </svg>
      `;
    } else {
      sendBtn.classList.remove('stop-mode');
      sendBtn.disabled = !chatInput.value.trim();
      sendBtn.setAttribute('title', 'Kirim Pesan');
      sendBtn.setAttribute('aria-label', 'Kirim Pesan');
      sendBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      `;
    }
  }

  // Penyesuaian Tinggi Textarea Dinamis (Auto-grow)
  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    const newHeight = Math.min(chatInput.scrollHeight, 160);
    chatInput.style.height = newHeight + 'px';

    const inputBox = chatInput.closest('.input-box');
    if (inputBox) {
      if (newHeight > 30) {
        inputBox.classList.add('multiline');
      } else {
        inputBox.classList.remove('multiline');
      }
    }

    updateSendButtonState(isGenerating);
  }

  // Event Listeners Input
  chatInput.addEventListener('input', adjustTextareaHeight);

  // Implementasi IME-Safe Keyboard Enter Submission
  // Sesuai dengan pedoman Modern Web Guidance (mencegah salah kirim saat mengetik IME Jepang/Mandarin/dsb)
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      // Hindari submit jika proses komposisi karakter sedang aktif atau keyCode 229
      if (event.isComposing || event.keyCode === 229) {
        return;
      }

      if (chatInput.value.trim() && !isGenerating) {
        sendMessage(chatInput.value);
      }
    }
  });

  // Submit via Form atau Klik Tombol Stop
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isGenerating) {
      abortGeneration();
      return;
    }
    if (chatInput.value.trim()) {
      sendMessage(chatInput.value);
    }
  });

  // Tombol Prompt Cepat (Suggestion Pills)
  document.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (prompt && !isGenerating) {
        sendMessage(prompt);
      }
    });
  });

  // Bersihkan Sesi Obrolan (Clear Chat)
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (chatHistory.length === 0) {
        showToast('Obrolan sudah kosong.');
        return;
      }

      if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan saat ini?')) {
        chatHistory = [];
        chatContainer.innerHTML = '';
        if (welcomeHero) {
          chatContainer.appendChild(welcomeHero);
          welcomeHero.style.display = 'block';
        }
        showToast('Sesi obrolan berhasil dibersihkan.');
        chatInput.focus();
      }
    });
  }

  // Modal Informasi Arsitektur
  if (infoBtn && infoModal) {
    infoBtn.addEventListener('click', () => {
      infoModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
      infoModal.classList.remove('active');
    });

    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) {
        infoModal.classList.remove('active');
      }
    });
  }

  // Inisialisasi awal fokus
  chatInput.focus();
  adjustTextareaHeight();
});

<?php
/**
 * Tampilan Utama Web Chatbot AI
 * Bagian backend untuk pemanggilan API AI telah dipisahkan ke dalam `api.php` & `config.php`.
 * File ini berfokus murni pada struktur tampilan antarmuka (Frontend View).
 */
require_once __DIR__ . '/config.php';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Studio - Chatbot Asisten Cerdas</title>
    <meta name="description" content="Aplikasi Web Chatbot Modern dengan Google Gemini AI - Terpisah Frontend dan Backend API">

    <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Stylesheet Utama -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="app-container">
        <!-- Header Aplikasi -->
        <header class="app-header">
            <div class="brand-wrapper">
                <div class="brand-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                    </svg>
                </div>
                <div class="brand-info">
                    <h1>Chatbot App</h1>
                    <div class="status-badge">
                        <span class="status-dot"></span>
                        <span>Online &bull; <?php echo htmlspecialchars(GEMINI_MODEL); ?></span>
                    </div>
                </div>
            </div>

            <div class="header-actions">
                <button type="button" class="btn-header" id="infoBtn" title="Informasi Arsitektur">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Struktur Sistem</span>
                </button>
                <button type="button" class="btn-header" id="clearChatBtn" title="Hapus Riwayat Obrolan">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    <span>Reset Chat</span>
                </button>
            </div>
        </header>

        <!-- Area Obrolan (Viewport) -->
        <main class="chat-viewport" id="chatViewport">
            <div class="chat-container" id="chatContainer">
                <!-- Welcome Hero / State Awal -->
                <div class="welcome-hero" id="welcomeHero">
                    <div class="hero-pill">
                        <span>✨ Powered by Google Gemini AI</span>
                    </div>
                    <h2>Halo! Ada yang bisa saya bantu hari ini?</h2>
                    <p>Tanyakan topik apa saja seputar pemrograman, ide proyek, analisis teks, atau eksplorasi ide kreatif.</p>

                    <!-- Saran Prompt Cepat -->
                    <div class="quick-prompts-grid">
                        <div class="prompt-card" data-prompt="Jelaskan apa itu REST API dan bagaimana cara kerjanya secara sederhana?">
                            <div class="prompt-card-header">
                                <span>🌐 Pemrograman Web</span>
                            </div>
                            <div class="prompt-card-text">
                                Apa itu REST API dan bagaimana cara kerjanya secara sederhana?
                            </div>
                        </div>

                        <div class="prompt-card" data-prompt="Berikan contoh fungsi PHP untuk memvalidasi format email dan nomor telepon.">
                            <div class="prompt-card-header">
                                <span>💻 Kode PHP</span>
                            </div>
                            <div class="prompt-card-text">
                                Buat contoh fungsi PHP validasi email & nomor telepon.
                            </div>
                        </div>

                        <div class="prompt-card" data-prompt="Bagaimana strategi meningkatkan performa website agar waktu muatnya cepat?">
                            <div class="prompt-card-header">
                                <span>⚡ Performa & Optimasi</span>
                            </div>
                            <div class="prompt-card-text">
                                Cara efektif meningkatkan kecepatan website.
                            </div>
                        </div>

                        <div class="prompt-card" data-prompt="Buatkan draf ide bisnis digital berbasis AI untuk pemula di Indonesia.">
                            <div class="prompt-card-header">
                                <span>💡 Ide & Strategi</span>
                            </div>
                            <div class="prompt-card-text">
                                Ide bisnis digital berbasis AI yang realistis untuk pemula.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Area Input Pesan (Floating Glass Box) -->
        <footer class="chat-input-area">
            <div class="input-container">
                <form id="chatForm">
                    <div class="input-box">
                        <textarea 
                            id="chatInput" 
                            class="chat-textarea" 
                            placeholder="Ketik pertanyaan atau perintah Anda di sini..." 
                            rows="1"
                            aria-label="Ketik pesan Anda"
                            required
                        ></textarea>
                        <button type="submit" id="sendBtn" class="send-button" aria-label="Kirim Pesan" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                        </button>
                    </div>
                </form>
                <div class="input-helper-text">
                    <span>Tekan <strong>Enter</strong> untuk mengirim &bull; <strong>Shift + Enter</strong> untuk baris baru</span>
                </div>
            </div>
        </footer>
    </div>

    <!-- Modal Informasi Arsitektur & Pemisahan File -->
    <div class="modal-overlay" id="infoModal">
        <div class="modal-card">
            <div class="modal-header">
                <h3>Arsitektur Sistem Chatbot</h3>
                <button type="button" class="modal-close-btn" id="closeModalBtn" aria-label="Tutup Modal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Aplikasi ini telah memisahkan antara bagian <strong>tampilan (Frontend)</strong> dan bagian <strong>pemrosesan AI (Backend API)</strong>:</p>
                <div class="architecture-badge-list">
                    <div class="arch-item">
                        <span class="tag fe">FRONTEND</span>
                        <div>
                            <strong>index.php, style.css, app.js</strong><br>
                            <small>Mengatur tampilan antarmuka modern, interaksi, auto-resize input, animasi, dan rendering respons AI.</small>
                        </div>
                    </div>
                    <div class="arch-item">
                        <span class="tag be">BACKEND</span>
                        <div>
                            <strong>api.php</strong><br>
                            <small>REST API endpoint independen yang menerima request JSON, memvalidasi input, dan memanggil cURL Google Gemini.</small>
                        </div>
                    </div>
                    <div class="arch-item">
                        <span class="tag ai">CONFIG</span>
                        <div>
                            <strong>config.php</strong><br>
                            <small>Menyimpan API Key, pemilihan model (Gemini 3.8 Flash), dan instruksi sistem secara terisolasi.</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification Banner -->
    <div class="toast-alert" id="toastAlert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span id="toastMessage">Pemberitahuan</span>
    </div>

    <!-- Script Utama Frontend -->
    <script src="assets/js/app.js"></script>
</body>
</html>

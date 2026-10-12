<?php
/**
 * Konfigurasi Utama Chatbot AI
 * File ini memisahkan konfigurasi sensitif (API Key & Model)
 * agar mudah dikelola tanpa menyentuh kode tampilan atau logika API.
 */

// API Key Google Gemini (Google AI Studio)
define('GEMINI_API_KEY', 'INI_KEY_GEMINI_SAYA');

// Model Gemini yang digunakan
define('GEMINI_MODEL', 'gemini-3.8-flash');

// Endpoint Resmi Google Generative Language API
define('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/' . GEMINI_MODEL . ':generateContent');

// System Instruction untuk memandu persona AI
define('SYSTEM_INSTRUCTION', 'Kamu adalah asisten AI yang cerdas, ramah, dan profesional. Jawablah pertanyaan pengguna dengan jelas, terstruktur, dan gunakan bahasa Indonesia yang baik. Gunakan format Markdown (seperti bold, list, atau code block) untuk mempermudah pembaca memahami jawaban.');

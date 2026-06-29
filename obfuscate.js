/**
 * 小叶助手 - Chrome 插件混淆构建脚本
 * 用法: node obfuscate.js
 * 输出: chromeplugin-dist/ (混淆后的插件目录)
 */
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = path.join(__dirname, 'chromeplugin');
const distDir = path.join(__dirname, 'chromeplugin-dist');

// ========== 必须保护的字符串 ==========
// 这些字符串用于 DOM 操作、Chrome API、消息传递，混淆后会 break
const reservedStrings = [
  // --- Chrome API / DOM globals ---
  'chrome', 'document', 'window', 'navigator', 'console', 'fetch',
  'localStorage', 'crypto', 'setTimeout', 'setInterval', 'clearTimeout',
  'clearInterval', 'Uint8Array', 'TextDecoder', 'DecompressionStream',
  'URLSearchParams', 'Promise', 'Object', 'Array', 'JSON', 'parseInt',
  'Math', 'Date', 'RegExp', 'Error', 'btoa', 'atob', 'encodeURIComponent',
  'decodeURIComponent', 'getComputedStyle',

  // --- Chrome API namespaces ---
  'runtime', 'tabs', 'storage', 'windows', 'scripting', 'contextMenus',
  'commands', 'action', 'system', 'display', 'sync', 'local', 'desktopCapture',

  // --- Chrome API methods / events ---
  'sendMessage', 'onMessage', 'addListener', 'onInstalled', 'onStartup',
  'onClicked', 'onActivated', 'onRemoved', 'onCommand', 'onChanged',
  'get', 'set', 'remove', 'update', 'query', 'create', 'removeAll',
  'executeScript', 'writeText', 'getSelection', 'getDisplayMedia',
  'getInfo', 'getRandomValues', 'clipboard',

  // --- DOM IDs (popup.html) ---
  'current-page-title', 'current-page-url', 'btn-send', 'chat-input',
  'chat-messages', 'char-count', 'btn-translate', 'translate-input',
  'translate-result', 'translate-result-text', 'btn-swap-lang',
  'btn-summarize', 'translate-from', 'translate-to', 'btn-open-source-tab',
  'btn-history', 'btn-clear-history', 'btn-settings', 'btn-save-settings',
  'setting-provider', 'custom-api-group', 'setting-apikey', 'setting-apibase',
  'setting-model', 'setting-lang', 'settings-status', 'summary-result',
  'summary-result-text', 'summary-page-title', 'btn-ask-about',
  'reminder-modal', 'reminder-count', 'reminder-next', 'btn-dismiss-reminder',
  'toast', 'history-list', 'loading-msg', 'api-warning',
  'panel-chat', 'panel-translate', 'panel-summary', 'panel-history',
  'panel-settings',

  // --- DOM IDs (content.js) ---
  'xiaoye-popup', '__xiaoye_translating', 'xiaoye-device-id',

  // --- CSS classes / selectors ---
  'active', 'show', 'msg', 'assistant', 'user', 'markdown-body',
  'msg-avatar', 'msg-content', 'tab-btn', 'quick-btn', 'panel',
  'copy-btn', 'text-btn', 'primary-btn', 'icon-btn', 'empty-state',
  'history-item', 'hi-type', 'hi-preview', 'hi-time', 'typing-indicator',
  'welcome', 'loading-msg', 'status-msg', 'success', 'error',
  'summary-option', 'input', 'checked', 'button', 'data-action',
  'data-target', 'data-tab', 'target', 'contains',

  // --- Message action names ---
  'get-config', 'save-config', 'get-tab-info', 'popup-init',
  'source-tab-changed', 'translate-text', 'summarize-page',
  'explain-text', 'translate-page', 'translate-page-content',
  'trigger-translate-page', 'get-page-content', 'get-selection',
  'get-selected-text', 'get-page-full-text', 'ping', 'pong',

  // --- Storage keys ---
  'config', 'xiaoye_device_id', 'xiaoye_usage_', 'xiaoye_history',
  'lingxi_history', '_pop', '_pendingAction', '_pendingExtra',

  // --- Event names ---
  'mouseup', 'click', 'scroll', 'keydown', 'input', 'change',
  'DOMContentLoaded', 'focus', 'blur',

  // --- Misc identifiers ---
  'Popup', 'tabId', 'sourceTabId', 'targetLang', 'apiProvider',
  'apiKey', 'apiBase', 'model', 'maxTokens', 'temperature',
  'source-tab-changed', 'popup-init', 'separator',

  // --- Tab / panel names ---
  'chat', 'translate', 'summary', 'history', 'settings',

  // --- Language codes & API values ---
  'auto', 'zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'zh-CN',
  'zh-TW', 'xiaoye', 'qwen', 'deepseek', 'zhipu', 'custom', 'xioaye',
  'qwen-turbo', 'deepseek-chat', 'glm-4-flash', 'mdjddj',

  // --- Content script IDs ---
  'SCRIPT', 'STYLE', 'IFRAME', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE',

  // --- Other ---
  'uubz', 'width', 'height', 'left', 'top', 'right', 'bottom',
  'translate-selection', 'summarize-page', 'explain-selection',
  'open-lingxi', 'toggle_translate', '_execute_action',
  'greeting', 'popup', 'normal', 'page', 'selection',
];

// 去重
const uniqueReservedStrings = [...new Set(reservedStrings)];

// ========== 基础混淆配置 ==========
const baseOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  debugProtection: false,        // Chrome 扩展中不能开启，会破坏 devtools
  debugProtectionInterval: 0,
  disableConsoleOutput: false,    // 保留 console，方便 debug
  identifierNamesGenerator: 'mangled',
  rotateStringArray: true,
  selfDefending: false,          // 可能导致扩展运行异常
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.5,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.5,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  reservedStrings: uniqueReservedStrings,
  renameGlobals: false,          // 不重命名全局变量
};

// ========== 需要特殊处理的文件 ==========
const fileConfigs = {
  'popup.js': {
    ...baseOptions,
    // popup.js 有大量 DOM 操作，降低控制流混淆阈值
    controlFlowFlatteningThreshold: 0.4,
    deadCodeInjectionThreshold: 0.2,
    stringArrayThreshold: 0.6,
  },
  'background.js': {
    ...baseOptions,
    // Service Worker 可以更强混淆
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjectionThreshold: 0.4,
    stringArrayThreshold: 0.75,
  },
  'content.js': {
    ...baseOptions,
    // content script 注入到页面，保持轻量
    controlFlowFlatteningThreshold: 0.3,
    deadCodeInjection: false,
    stringArrayThreshold: 0.4,
  },
  'options.js': {
    ...baseOptions,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjectionThreshold: 0.2,
    stringArrayThreshold: 0.5,
  },
};

// ========== 构建 ==========
// 1. 清空输出目录
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. 遍历源目录
const entries = fs.readdirSync(srcDir, { recursive: true, withFileTypes: true });

for (const entry of entries) {
  const srcPath = path.join(entry.parentPath || srcDir, entry.name);
  const relPath = path.relative(srcDir, srcPath);
  const distPath = path.join(distDir, relPath);

  if (entry.isDirectory()) {
    fs.mkdirSync(distPath, { recursive: true });
    continue;
  }

  if (entry.name.endsWith('.js')) {
    // 混淆 JS
    const code = fs.readFileSync(srcPath, 'utf-8');
    const options = fileConfigs[entry.name] || baseOptions;

    console.log(`🔒 Obfuscating: ${relPath} (${(code.length / 1024).toFixed(1)} KB)`);

    try {
      const result = JavaScriptObfuscator.obfuscate(code, options);
      const obfuscated = result.getObfuscatedCode();
      fs.writeFileSync(distPath, obfuscated, 'utf-8');
      console.log(`   ✅ Done: ${(obfuscated.length / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      // 出错时复制原文件
      fs.copyFileSync(srcPath, distPath);
    }
  } else {
    // 直接复制其他文件（json, html, css, png 等）
    fs.copyFileSync(srcPath, distPath);
    console.log(`📄 Copy: ${relPath}`);
  }
}

console.log('\n🎉 Build complete! Output: chromeplugin-dist/');

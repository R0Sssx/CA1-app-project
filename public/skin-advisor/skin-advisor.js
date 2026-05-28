(function () {
  'use strict';

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const API_URL = '/api/skin-advisor';

  let imageBase64 = null;
  let imageMimeType = null;
  let imagePreviewUrl = null;
  let isLoading = false;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatReply(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function buildDom() {
    const backdrop = document.createElement('div');
    backdrop.className = 'skin-advisor-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const drawer = document.createElement('aside');
    drawer.className = 'skin-advisor-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Skin Advisor');
    drawer.innerHTML = `
      <header class="skin-advisor-header">
        <h2><span>Skin</span> Advisor</h2>
        <button type="button" class="skin-advisor-close" aria-label="Close panel">&times;</button>
      </header>
      <div class="skin-advisor-messages" id="skin-advisor-messages">
        <p class="skin-advisor-welcome">
          Describe your skin concerns or upload a photo — I'll suggest products and a simple routine.
        </p>
      </div>
      <footer class="skin-advisor-footer">
        <div class="skin-advisor-preview-row" id="skin-advisor-preview-row">
          <img class="skin-advisor-preview" id="skin-advisor-preview" alt="Upload preview" />
          <button type="button" class="skin-advisor-remove-image" id="skin-advisor-remove-image">Remove photo</button>
        </div>
        <div class="skin-advisor-input-row">
          <label class="skin-advisor-upload-label" title="Upload skin photo">
            📷
            <input type="file" id="skin-advisor-file" accept="image/jpeg,image/png,image/webp" />
          </label>
          <textarea
            class="skin-advisor-text"
            id="skin-advisor-text"
            rows="1"
            placeholder="e.g. oily T-zone, dry cheeks..."
          ></textarea>
          <button type="button" class="skin-advisor-send" id="skin-advisor-send">Send</button>
        </div>
        <div class="skin-advisor-actions">
          <button type="button" class="skin-advisor-reset" id="skin-advisor-reset">Clear chat</button>
        </div>
      </footer>
    `;

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'skin-advisor-fab';
    fab.setAttribute('aria-label', 'Open Skin Advisor');
    fab.setAttribute('aria-expanded', 'false');
    fab.textContent = '🌸';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.appendChild(fab);

    return {
      fab,
      backdrop,
      drawer,
      messages: drawer.querySelector('#skin-advisor-messages'),
      textInput: drawer.querySelector('#skin-advisor-text'),
      fileInput: drawer.querySelector('#skin-advisor-file'),
      sendBtn: drawer.querySelector('#skin-advisor-send'),
      resetBtn: drawer.querySelector('#skin-advisor-reset'),
      closeBtn: drawer.querySelector('.skin-advisor-close'),
      previewRow: drawer.querySelector('#skin-advisor-preview-row'),
      previewImg: drawer.querySelector('#skin-advisor-preview'),
      removeImageBtn: drawer.querySelector('#skin-advisor-remove-image')
    };
  }

  function openPanel(els) {
    els.backdrop.classList.add('is-open');
    els.drawer.classList.add('is-open');
    els.fab.setAttribute('aria-expanded', 'true');
    els.backdrop.setAttribute('aria-hidden', 'false');
    els.textInput.focus();
  }

  function closePanel(els) {
    els.backdrop.classList.remove('is-open');
    els.drawer.classList.remove('is-open');
    els.fab.setAttribute('aria-expanded', 'false');
    els.backdrop.setAttribute('aria-hidden', 'true');
  }

  function scrollMessages(els) {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function appendMessage(els, role, contentHtml, options = {}) {
    const isUser = role === 'user';
    const isError = role === 'error';
    const msg = document.createElement('div');
    msg.className = 'skin-advisor-msg skin-advisor-msg--' + (isError ? 'error' : isUser ? 'user' : 'ai');

    const avatar = document.createElement('span');
    avatar.className = 'skin-advisor-msg-avatar';
    avatar.textContent = isUser ? '👤' : '🌸';

    const bubble = document.createElement('div');
    bubble.className = 'skin-advisor-msg-bubble';
    bubble.innerHTML = contentHtml;

    if (options.imageUrl) {
      const img = document.createElement('img');
      img.className = 'skin-advisor-msg-image';
      img.src = options.imageUrl;
      img.alt = 'Uploaded skin photo';
      bubble.appendChild(img);
    }

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    els.messages.appendChild(msg);
    scrollMessages(els);
    return msg;
  }

  function showLoading(els) {
    const msg = document.createElement('div');
    msg.className = 'skin-advisor-msg skin-advisor-msg--ai';
    msg.id = 'skin-advisor-loading';
    msg.innerHTML = `
      <span class="skin-advisor-msg-avatar">🌸</span>
      <div class="skin-advisor-msg-bubble">
        <div class="skin-advisor-loading" aria-label="Thinking">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    els.messages.appendChild(msg);
    scrollMessages(els);
  }

  function hideLoading(els) {
    const el = document.getElementById('skin-advisor-loading');
    if (el) el.remove();
  }

  function clearImage(els) {
    imageBase64 = null;
    imageMimeType = null;
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      imagePreviewUrl = null;
    }
    els.fileInput.value = '';
    els.previewRow.classList.remove('has-image');
    els.previewImg.removeAttribute('src');
  }

  function resetChat(els) {
    els.messages.innerHTML = `
      <p class="skin-advisor-welcome">
        Describe your skin concerns or upload a photo — I'll suggest products and a simple routine.
      </p>
    `;
    els.textInput.value = '';
    clearImage(els);
  }

  function setLoading(els, loading) {
    isLoading = loading;
    els.sendBtn.disabled = loading;
    els.textInput.disabled = loading;
    els.fileInput.disabled = loading;
  }

  function handleFileSelect(els, file) {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      appendMessage(
        els,
        'error',
        escapeHtml('Please upload a JPG, PNG, or WEBP image.')
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result;
      const commaIndex = dataUrl.indexOf(',');
      imageBase64 = dataUrl.slice(commaIndex + 1);
      imageMimeType = file.type;

      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      imagePreviewUrl = URL.createObjectURL(file);
      els.previewImg.src = imagePreviewUrl;
      els.previewRow.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }

  async function sendMessage(els) {
    const text = els.textInput.value.trim();
    const hasImage = Boolean(imageBase64);

    if (!text && !hasImage) {
      appendMessage(
        els,
        'error',
        escapeHtml('Please enter a message or upload a skin photo before sending.')
      );
      return;
    }

    if (isLoading) return;

    const displayText = text || '(Photo uploaded for analysis)';
    let userHtml = escapeHtml(displayText);
    const previewForMsg = imagePreviewUrl;

    appendMessage(els, 'user', userHtml, { imageUrl: previewForMsg || undefined });

    const payload = {
      text: text || 'Please analyze my uploaded skin photo and suggest a skincare routine.',
      hasImage,
      imageBase64: hasImage ? imageBase64 : undefined,
      mimeType: hasImage ? imageMimeType : undefined
    };

    els.textInput.value = '';
    clearImage(els);

    setLoading(els, true);
    showLoading(els);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      hideLoading(els);

      if (!res.ok) {
        const errMsg =
          data.error ||
          data.message ||
          'Something went wrong. Please try again in a moment.';
        appendMessage(els, 'error', escapeHtml(errMsg));
        return;
      }

      if (!data.reply) {
        appendMessage(
          els,
          'error',
          escapeHtml(
            data.error ||
              'I could not analyze that request. Try a different photo or description.'
          )
        );
        return;
      }

      appendMessage(els, 'ai', formatReply(data.reply));
    } catch (err) {
      hideLoading(els);
      appendMessage(
        els,
        'error',
        escapeHtml('Unable to reach the Skin Advisor. Check your connection and try again.')
      );
    } finally {
      setLoading(els, false);
    }
  }

  function init() {
    const els = buildDom();

    els.fab.addEventListener('click', () => {
      const open = els.drawer.classList.contains('is-open');
      if (open) closePanel(els);
      else openPanel(els);
    });

    els.closeBtn.addEventListener('click', () => closePanel(els));
    els.backdrop.addEventListener('click', () => closePanel(els));

    els.fileInput.addEventListener('change', function () {
      const file = this.files && this.files[0];
      handleFileSelect(els, file);
    });

    els.removeImageBtn.addEventListener('click', () => clearImage(els));
    els.sendBtn.addEventListener('click', () => sendMessage(els));
    els.resetBtn.addEventListener('click', () => resetChat(els));

    els.textInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(els);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.drawer.classList.contains('is-open')) {
        closePanel(els);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

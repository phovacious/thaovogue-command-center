import { useState, useRef } from 'react';

// Modal for manual copy on mobile
function CopyModal({ text, onClose }) {
  const textRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleSelectAll = () => {
    if (textRef.current) {
      textRef.current.focus();
      textRef.current.select();
      textRef.current.setSelectionRange(0, textRef.current.value.length);

      // Try to copy after selection
      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (e) {
        console.log('Copy after select failed:', e);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white">Copy Snapshot</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-xl rounded-full hover:bg-slate-700"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden">
          <p className="text-slate-400 text-sm mb-3">
            Tap the text to select, then copy:
          </p>
          <textarea
            ref={textRef}
            value={text}
            readOnly
            onClick={(e) => {
              e.target.select();
              e.target.setSelectionRange(0, e.target.value.length);
            }}
            className="w-full h-48 bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none border border-slate-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="p-4 border-t border-slate-700 flex gap-2">
          <button
            onClick={handleSelectAll}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'
            }`}
          >
            {copied ? '✓ Copied!' : 'Select All & Copy'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-lg text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function CopyButton({ getText, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState('');

  // Detect mobile
  const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const handleCopy = async () => {
    setLoading(true);
    setError(null);

    let text = '';
    try {
      text = await getText();
      console.log('Copy: Got text, length:', text?.length);
    } catch (err) {
      console.error('Copy: Failed to get text:', err);
      setError('Failed');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
      return;
    }

    if (!text) {
      console.error('Copy: No text to copy');
      setError('No data');
      setTimeout(() => setError(null), 3000);
      setLoading(false);
      return;
    }

    // On mobile, always show modal (more reliable)
    if (isMobile()) {
      console.log('Copy: Mobile detected, showing modal');
      setModalText(text);
      setShowModal(true);
      setLoading(false);
      return;
    }

    // On desktop, try clipboard API first
    let success = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
        console.log('Copy: Success via Clipboard API');
      } catch (clipboardErr) {
        console.warn('Copy: Clipboard API failed:', clipboardErr.message);
      }
    }

    // Fallback to execCommand
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);

        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, text.length);

        success = document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Copy: execCommand result:', success);
      } catch (execErr) {
        console.error('Copy: execCommand failed:', execErr.message);
      }
    }

    // If all else fails, show modal
    if (!success) {
      console.log('Copy: All methods failed, showing modal');
      setModalText(text);
      setShowModal(true);
      setLoading(false);
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
          error
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : copied
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 active:bg-slate-500 border border-slate-600'
        } ${loading ? 'opacity-50 cursor-wait' : ''} ${className}`}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : error ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {error || (copied ? 'Copied!' : label)}
      </button>

      {showModal && (
        <CopyModal
          text={modalText}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

import { useState } from 'react';

export function CopyButton({ getText, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCopy = async () => {
    setLoading(true);
    setError(null);

    let text = '';
    try {
      text = await getText();
      console.log('Copy: Got text, length:', text?.length);
    } catch (err) {
      console.error('Copy: Failed to get text:', err);
      setError('Failed to get data');
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

    let success = false;

    // Method 1: Modern Clipboard API (only works on HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
        console.log('Copy: Success via Clipboard API');
      } catch (clipboardErr) {
        console.warn('Copy: Clipboard API failed:', clipboardErr.message);
      }
    } else {
      console.log('Copy: Clipboard API not available (isSecureContext:', window.isSecureContext, ')');
    }

    // Method 2: execCommand fallback (works on HTTP, older browsers, iOS Safari)
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        // Make it invisible but still functional
        textArea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
        textArea.setAttribute('readonly', ''); // Prevent keyboard on mobile
        document.body.appendChild(textArea);

        // iOS Safari specific
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, text.length); // For iOS

        success = document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Copy: execCommand result:', success);
      } catch (execErr) {
        console.error('Copy: execCommand failed:', execErr.message);
      }
    }

    // Method 3: Last resort - show alert with text
    if (!success) {
      console.log('Copy: All methods failed, showing alert');
      // Truncate for alert if too long
      const truncated = text.length > 500 ? text.substring(0, 500) + '\n\n[...truncated]' : text;
      alert('Could not copy automatically. Please copy manually:\n\n' + truncated);
      setLoading(false);
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setLoading(false);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
        error
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
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
  );
}

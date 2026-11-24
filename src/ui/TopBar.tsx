import { useEffect, useRef, useState } from 'react';

interface TopBarProps {
  onCopyLink: () => Promise<{ ok: boolean; url: string }>;
}

export function TopBar({ onCopyLink }: TopBarProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (fallbackUrl && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [fallbackUrl]);

  const handleCopy = async () => {
    const result = await onCopyLink();
    if (result.ok) {
      setFallbackUrl(null);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 2400);
    } else {
      setCopied(false);
      setFallbackUrl(result.url);
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="title-row">
          <h1 className="app-title">Premium Melt</h1>
          <span className="app-subtitle">
            One NIFTY weekly expiry, priced with Black-Scholes
          </span>
        </div>
        <p className="advice-notice">
          Teaching model, not advice. Not affiliated with NSE.
        </p>
      </div>

      <div className="top-bar-right">
        <div className="copy-wrap">
          <button
            type="button"
            className="btn-copy"
            onClick={handleCopy}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          {fallbackUrl && (
            <input
              ref={inputRef}
              type="text"
              readOnly
              className="copy-fallback"
              aria-label="Shareable URL"
              value={fallbackUrl}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() => setFallbackUrl(null)}
            />
          )}
        </div>
        <p className="credit-line">
          Built with Gemini 4.0 by{' '}
          <a
            href="https://x.com/prayushkale"
            target="_blank"
            rel="noopener noreferrer"
          >
            @prayushkale
          </a>
        </p>
      </div>
    </header>
  );
}

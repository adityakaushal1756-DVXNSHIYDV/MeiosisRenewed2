import { useState, useEffect, useCallback } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';

interface PDFModalProps {
  url: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function PDFModal({ url, title, subtitle, onClose }: PDFModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 9900,
        background: 'rgba(2,12,26,0.78)',
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'pdfFadeIn 0.22s ease',
      }}
    >
      <style>{`
        @keyframes pdfFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pdfSlideUp { from { opacity: 0; transform: translateY(32px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      {/* Modal window */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 900,
          height: 'min(88vh, 980px)',
          background: 'linear-gradient(180deg, #0d2444 0%, #091c37 100%)',
          borderRadius: 28,
          border: '1px solid rgba(147,201,255,0.20)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.70), 0 0 0 1px rgba(255,255,255,0.04) inset',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'pdfSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(147,201,255,0.12)',
          background: 'rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}>
          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(96,165,250,0.28),rgba(125,211,252,0.16))',
            border: '1px solid rgba(125,211,252,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={17} color="#7dd3fc" strokeWidth={2} />
          </div>

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#f0f8ff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 11, color: 'rgba(168,200,232,0.70)', marginTop: 1 }}>{subtitle}</div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <a
              href={`${url}?download=1`}
              download
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'rgba(96,165,250,0.14)',
                border: '1px solid rgba(125,211,252,0.26)',
                borderRadius: 10,
                fontSize: 12, fontWeight: 600, color: '#7dd3fc',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.24)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.14)')}
            >
              <Download size={13} strokeWidth={2.2} />
              Download
            </a>

            <button
              type="button"
              onClick={close}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#a8c8e8',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* ── PDF viewer ── */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {/* Loading state */}
          {loading && !error && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
              background: 'linear-gradient(180deg, #0d2444 0%, #091c37 100%)',
              zIndex: 2,
            }}>
              <Loader2
                size={32}
                color="#7dd3fc"
                strokeWidth={2}
                style={{ animation: 'spin 0.9s linear infinite' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(168,200,232,0.70)' }}>Loading document…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'linear-gradient(180deg, #0d2444 0%, #091c37 100%)',
            }}>
              <FileText size={40} color="rgba(168,200,232,0.35)" strokeWidth={1.5} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f8ff' }}>Could not load document</div>
              <div style={{ fontSize: 12, color: 'rgba(168,200,232,0.60)', maxWidth: 280, textAlign: 'center' }}>
                The PDF may still be generating. Try downloading it directly.
              </div>
              <a
                href={`${url}?download=1`}
                download
                style={{
                  marginTop: 6,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px',
                  background: 'rgba(96,165,250,0.18)',
                  border: '1px solid rgba(125,211,252,0.30)',
                  borderRadius: 10,
                  fontSize: 13, fontWeight: 600, color: '#7dd3fc',
                  textDecoration: 'none',
                }}
              >
                <Download size={14} strokeWidth={2.2} /> Download instead
              </a>
            </div>
          )}

          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: error ? 'none' : 'block',
              background: '#fff',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}

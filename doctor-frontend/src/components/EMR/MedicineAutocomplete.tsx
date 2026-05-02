import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MedicineDBRecord, searchMedicines } from '../../lib/medicineSearch';
import { Loader } from 'lucide-react';

interface MedicineAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (med: MedicineDBRecord) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function MedicineAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Medicine name",
  className = "",
  onKeyDown
}: MedicineAutocompleteProps) {
  const [query, setQuery]     = useState(value);
  const [results, setResults] = useState<MedicineDBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen]   = useState(false);
  // Position of the dropdown in viewport coordinates
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync incoming prop value
  useEffect(() => { setQuery(value); }, [value]);

  // Compute dropdown position. Width spans the full parent prescription row.
  function computePos() {
    const input = inputRef.current;
    if (!input) return;

    const inputRect = input.getBoundingClientRect();

    // Walk up the DOM to find the parent flex row (the prescription row div).
    // The row is the nearest ancestor that is significantly wider than the input.
    let rowEl: HTMLElement | null = input.parentElement;
    while (rowEl && rowEl.getBoundingClientRect().width < inputRect.width * 1.5) {
      rowEl = rowEl.parentElement;
    }
    const rowRect = rowEl ? rowEl.getBoundingClientRect() : inputRect;

    const dropH   = 340;
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const openUp  = spaceBelow < dropH && spaceAbove > spaceBelow;

    setDropPos({
      top:   openUp ? inputRect.top - dropH - 4 : inputRect.bottom + 4,
      left:  rowRect.left,
      width: rowRect.width,
    });
  }

  // Close when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        !(document.getElementById('med-autocomplete-portal')?.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Recompute position on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => computePos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen]);

  // Search logic with debounce
  useEffect(() => {
    if (!isOpen || !query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await searchMedicines(query);
        setResults(matches);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const dropdown = isOpen && query.trim().length > 0 ? createPortal(
    <div
      id="med-autocomplete-portal"
      style={{
        position:  'fixed',
        top:       dropPos?.top  ?? 0,
        left:      dropPos?.left ?? 0,
        width:     dropPos?.width ?? 460,
        zIndex:    99999,
        maxHeight: 320,
        overflowY: 'auto',
        borderRadius: 18,
        border:    '1px solid rgba(255,255,255,0.10)',
        background: '#0e1a27',
        boxShadow: '0 16px 56px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,255,136,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {results.length === 0 && !loading ? (
        <div style={{ padding: '16px 14px', fontSize: 12, color: 'rgba(180,200,220,0.45)', textAlign: 'center', fontStyle: 'italic' }}>
          No matches found for &quot;{query}&quot;
        </div>
      ) : (
        results.map((med, index) => (
          <button
            key={`${med.id}-${index}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // stop blur from firing before click
              const formattedName = `${med.generic_name.toUpperCase()} (${med.brand_name})`;
              onChange(formattedName);
              setQuery(formattedName);
              setIsOpen(false);
              onSelect(med);
            }}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              fontSize: 12,
              background: 'transparent',
              border: 'none',
              borderBottom: index !== results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s',
              gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {med.generic_name.toUpperCase()}
              </span>
              <div style={{ fontSize: 12.5, color: 'rgba(140,190,170,0.75)', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'thin', scrollbarColor: 'rgba(140,190,170,0.25) transparent' }}>
                {med.brand_name}
              </div>
            </div>
            {(med.dose_form_label || med.dose_form) && (
              <span style={{
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(0,255,136,0.70)',
                border: '1px solid rgba(0,255,136,0.18)',
                borderRadius: 999,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}>
                {med.dose_form_label || med.dose_form}
              </span>
            )}
          </button>
        ))
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative flex flex-col ${className}`} ref={wrapperRef}>
      <input
        ref={inputRef}
        className="input-shell w-full min-w-0"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
          setTimeout(computePos, 0);
        }}
        onFocus={() => {
          setIsOpen(true);
          computePos();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {loading && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader size={13} className="animate-spin text-neon/60" />
        </div>
      )}
      {dropdown}
    </div>
  );
}

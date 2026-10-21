import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;        // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  maxDate?: string;     // YYYY-MM-DD
  minDate?: string;     // YYYY-MM-DD
  /** Anchor element — calendar will be centered over this element */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DAYS_PT = ['D','S','T','Q','Q','S','S'];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function displayToISO(display: string): string {
  const clean = display.replace(/\D/g, '');
  if (clean.length < 8) return '';
  const d = parseInt(clean.slice(0, 2), 10);
  const m = parseInt(clean.slice(2, 4), 10);
  const y = parseInt(clean.slice(4, 8), 10);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return '';
  return toISO(y, m - 1, d);
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

export default function DatePicker({
  value, onChange, placeholder = 'DD/MM/AAAA',
  maxDate, minDate, anchorRef,
}: DatePickerProps) {
  const today = new Date();

  const [inputVal, setInputVal]     = useState(isoToDisplay(value));
  const [inputError, setInputError] = useState('');
  const [open, setOpen]             = useState(false);
  const [viewYear, setViewYear]     = useState(() => parseDate(value)?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth]   = useState(() => parseDate(value)?.getMonth()    ?? today.getMonth());
  const [yearPicker, setYearPicker] = useState(false);

  // Position of the calendar — centered over anchorRef if provided
  const [calStyle, setCalStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setInputVal(isoToDisplay(value));
    const d = parseDate(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  const computePosition = () => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      // Center of the anchor element in viewport
      const centerX = r.left + r.width / 2;
      const centerY = r.top  + r.height / 2 + window.scrollY;
      setCalStyle({
        position: 'absolute',
        top: centerY,
        left: centerX,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      });
    } else {
      // Fallback: fixed center of viewport
      setCalStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
      });
    }
  };

  const openCalendar = () => {
    computePosition();
    setOpen(true);
    setYearPicker(false);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open]);

  const maxD = parseDate(maxDate ?? '') ?? null;
  const minD = parseDate(minDate ?? '') ?? null;

  const isDisabled = (y: number, m: number, d: number) => {
    const dt = new Date(y, m, d);
    if (maxD && dt > maxD) return true;
    if (minD && dt < minD) return true;
    return false;
  };
  const isSelected = (y: number, m: number, d: number) => value === toISO(y, m, d);
  const isToday    = (y: number, m: number, d: number) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value);
    setInputVal(masked);
    setInputError('');
    if (masked.replace(/\D/g, '').length === 8) {
      const iso = displayToISO(masked);
      if (iso) {
        if (maxD && new Date(iso) > maxD) { setInputError('Data não pode ser no futuro'); return; }
        if (minD && new Date(iso) < minD) { setInputError('Data inválida'); return; }
        onChange(iso);
        const d = parseDate(iso)!;
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      } else {
        setInputError('Data inválida — usa DD/MM/AAAA');
      }
    } else if (masked === '') {
      onChange('');
    }
  };

  const handleInputBlur = () => {
    const digits = inputVal.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 8)
      setInputError('Data incompleta — usa DD/MM/AAAA');
  };

  // Calendar grid
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { day: number; month: number; year: number; current: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrev - firstDay + 1 + i;
    const [y, m] = viewMonth === 0 ? [viewYear - 1, 11] : [viewYear, viewMonth - 1];
    cells.push({ day: d, month: m, year: y, current: false });
  }
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ day: i, month: viewMonth, year: viewYear, current: true });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const [y, m] = viewMonth === 11 ? [viewYear + 1, 0] : [viewYear, viewMonth + 1];
    cells.push({ day: i, month: m, year: y, current: false });
  }

  const prevMonth = () => viewMonth === 0
    ? (setViewYear(y => y - 1), setViewMonth(11))
    : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11
    ? (setViewYear(y => y + 1), setViewMonth(0))
    : setViewMonth(m => m + 1);

  const yearStart = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  const selectDay = (y: number, m: number, d: number) => {
    if (isDisabled(y, m, d)) return;
    const iso = toISO(y, m, d);
    onChange(iso);
    setInputVal(isoToDisplay(iso));
    setInputError('');
    setOpen(false);
  };

  const selectToday = () => {
    const t = new Date();
    if (!isDisabled(t.getFullYear(), t.getMonth(), t.getDate())) {
      const iso = toISO(t.getFullYear(), t.getMonth(), t.getDate());
      onChange(iso); setInputVal(isoToDisplay(iso)); setInputError('');
    }
    setOpen(false);
  };

  const clearAll = () => { onChange(''); setInputVal(''); setInputError(''); setOpen(false); };

  // ── Calendar card (shared JSX) ─────────────────────────────────────────────
  const calCard = (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onClick={e => e.stopPropagation()}
      style={{
        ...calStyle,
        width: 280,
        background: 'white',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
        <div role="button" tabIndex={0}
          onClick={() => setYearPicker(v => !v)}
          onKeyDown={e => e.key === 'Enter' && setYearPicker(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 800, fontSize: 13, color: '#0F172A', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          {MONTHS_PT[viewMonth]} {viewYear}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#64748B" strokeWidth="2"
            style={{ transform: yearPicker ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="2 4 6 8 10 4"/>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[prevMonth, nextMonth].map((fn, idx) => (
            <div key={idx} role="button" tabIndex={0} onClick={fn}
              onKeyDown={e => e.key === 'Enter' && fn()}
              style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {idx === 0 ? <ChevronLeft size={14} strokeWidth={2.2}/> : <ChevronRight size={14} strokeWidth={2.2}/>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {yearPicker ? (
          <motion.div key="years" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}
          >
            <div role="button" tabIndex={0} onClick={() => setViewYear(y => y - 12)}
              onKeyDown={e => e.key === 'Enter' && setViewYear(y => y - 12)}
              style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#94A3B8', padding: '5px 0', borderRadius: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            ><ChevronLeft size={11}/> anteriores</div>

            {years.map(y => (
              <div key={y} role="button" tabIndex={0}
                onClick={() => { setViewYear(y); setYearPicker(false); }}
                onKeyDown={e => e.key === 'Enter' && (setViewYear(y), setYearPicker(false))}
                style={{ padding: '8px 0', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', background: y === viewYear ? '#1B5E3B' : 'transparent', color: y === viewYear ? 'white' : y === today.getFullYear() ? '#1B5E3B' : '#374151' }}
                onMouseEnter={e => { if (y !== viewYear) e.currentTarget.style.background = '#F0FDF4'; }}
                onMouseLeave={e => { if (y !== viewYear) e.currentTarget.style.background = 'transparent'; }}
              >{y}</div>
            ))}

            <div role="button" tabIndex={0} onClick={() => setViewYear(y => y + 12)}
              onKeyDown={e => e.key === 'Enter' && setViewYear(y => y + 12)}
              style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#94A3B8', padding: '5px 0', borderRadius: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >próximos <ChevronRight size={11}/></div>
          </motion.div>
        ) : (
          <motion.div key={`${viewYear}-${viewMonth}`} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.12 }}
            style={{ padding: 10 }}
          >
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {DAYS_PT.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, padding: '2px 0', color: i === 0 || i === 6 ? '#CBD5E1' : '#94A3B8' }}>{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
              {cells.map((cell, i) => {
                const sel = isSelected(cell.year, cell.month, cell.day);
                const tod = isToday(cell.year, cell.month, cell.day);
                const dis = isDisabled(cell.year, cell.month, cell.day);
                return (
                  <div key={i} role="button" tabIndex={dis ? -1 : 0}
                    onClick={() => selectDay(cell.year, cell.month, cell.day)}
                    onKeyDown={e => e.key === 'Enter' && selectDay(cell.year, cell.month, cell.day)}
                    style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 12, fontWeight: sel || tod ? 800 : 600, cursor: dis ? 'not-allowed' : 'pointer', background: sel ? '#1B5E3B' : 'transparent', color: sel ? 'white' : !cell.current || dis ? '#D1D5DB' : tod ? '#1B5E3B' : '#0F172A', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
                    onMouseEnter={e => { if (!sel && !dis && cell.current) e.currentTarget.style.background = '#F0FDF4'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {tod && !sel && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#1B5E3B' }} />}
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #F1F5F9' }}>
        <div role="button" tabIndex={0} onClick={clearAll}
          onKeyDown={e => e.key === 'Enter' && clearAll()}
          style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
        >Limpar</div>
        <div role="button" tabIndex={0} onClick={selectToday}
          onKeyDown={e => e.key === 'Enter' && selectToday()}
          style={{ fontSize: 11, fontWeight: 800, color: '#1B5E3B', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
        >Hoje</div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Text input row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 12,
        border: `1px solid ${open ? '#1B5E3B' : inputError ? '#EF4444' : '#E2E8F0'}`,
        boxShadow: open ? '0 0 0 3px rgba(27,94,59,0.1)' : inputError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
        background: '#F8FAFC',
        transition: 'border-color .15s, box-shadow .15s',
      }}>
        {/* Calendar icon */}
        <div role="button" tabIndex={0} onClick={openCalendar}
          onKeyDown={e => e.key === 'Enter' && openCalendar()}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', color: open ? '#1B5E3B' : '#94A3B8', WebkitTapHighlightColor: 'transparent', transition: 'color .15s' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2.5"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>

        <input
          type="text"
          inputMode="numeric"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none', color: inputVal ? '#0F172A' : '#94A3B8', fontFamily: 'inherit' }}
        />

        {inputVal && (
          <div role="button" tabIndex={0}
            onClick={() => { onChange(''); setInputVal(''); setInputError(''); }}
            onKeyDown={e => e.key === 'Enter' && (onChange(''), setInputVal(''), setInputError(''))}
            style={{ flexShrink: 0, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
            </svg>
          </div>
        )}
      </div>

      {/* Inline error */}
      <AnimatePresence>
        {inputError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', marginTop: 4, paddingLeft: 4, overflow: 'hidden' }}
          >{inputError}</motion.p>
        )}
      </AnimatePresence>

      {/* ── Calendar via portal ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.08)' }}
                onClick={() => setOpen(false)}
              />
              {calCard}
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

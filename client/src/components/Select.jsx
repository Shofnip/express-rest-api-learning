import { T } from '../theme';

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: T.text }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
        style={{ background: T.card, color: T.ink, borderColor: T.inputBorder }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

export default Select;

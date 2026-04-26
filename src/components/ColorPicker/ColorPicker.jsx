import React from 'react';
import './ColorPicker.css';

const COLORS = [
  { id: 'red',    label: 'Red',    hex: '#D32F2F' },
  { id: 'yellow', label: 'Yellow', hex: '#F9A825' },
  { id: 'green',  label: 'Green',  hex: '#2E7D32' },
  { id: 'blue',   label: 'Blue',   hex: '#1565C0' },
];

export default function ColorPicker({ onChoose }) {
  return (
    <div className="cp-overlay" role="dialog" aria-label="Choose a color">
      <div className="cp-card">
        <h2 className="cp-title">Choose a Color</h2>
        <div className="cp-grid">
          {COLORS.map(({ id, label, hex }) => (
            <button
              key={id}
              id={`cp-${id}`}
              className="cp-btn"
              style={{ '--c': hex }}
              onClick={() => onChoose(id)}
              aria-label={label}
            >
              <span className="cp-dot" />
              <span className="cp-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

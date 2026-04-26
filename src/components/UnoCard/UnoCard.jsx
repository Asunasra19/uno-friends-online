import React from 'react';
import { COLORS } from '../../data/cards';
import { Ban, RefreshCw } from 'lucide-react';

/* ── SVG symbol shapes ───────────────────────────────────────── */

function SkipSymbol({ color, size = 60 }) {
  return (
    <g transform={`translate(${-size / 2}, ${-size / 2})`}>
      <Ban size={size} color={color} strokeWidth={2.5} />
    </g>
  );
}

function ReverseSymbol({ color, size = 60 }) {
  return (
    <g transform={`translate(${-size / 2}, ${-size / 2})`}>
      <RefreshCw size={size} color={color} strokeWidth={2.5} />
    </g>
  );
}

function DrawTwoSymbol({ color, size = 60 }) {
  const scale = size / 100;
  return (
    <g transform={`scale(${scale})`}>
      {/* Back card */}
      <rect x={-15} y={-35} width={40} height={60} rx={6} ry={6} fill={color} opacity={0.4} />
      {/* Front card */}
      <rect x={-25} y={-15} width={40} height={55} rx={6} ry={6} fill="none" stroke={color} strokeWidth={6} />
      {/* +2 */}
      <text x={-5} y={15} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight="900" fontFamily="Arial Black, Impact, sans-serif" fill={color} stroke="#fff" strokeWidth={1.5}>
        +2
      </text>
    </g>
  );
}

function WildQuadrant() {
  /* Four colored pie slices in a circle */
  const r = 46;
  return (
    <g>
      {/* Red - top-left */}
      <path d={`M 0 0 L ${-r} 0 A ${r} ${r} 0 0 1 0 ${-r} Z`} fill="#D32F2F" />
      {/* Blue - top-right */}
      <path d={`M 0 0 L 0 ${-r} A ${r} ${r} 0 0 1 ${r} 0 Z`} fill="#1565C0" />
      {/* Yellow - bottom-right */}
      <path d={`M 0 0 L ${r} 0 A ${r} ${r} 0 0 1 0 ${r} Z`} fill="#F9A825" />
      {/* Green - bottom-left */}
      <path d={`M 0 0 L 0 ${r} A ${r} ${r} 0 0 1 ${-r} 0 Z`} fill="#2E7D32" />
      {/* Thin border lines between sections */}
      <line x1="0" y1={-r} x2="0" y2={r} stroke="#111" strokeWidth="2" />
      <line x1={-r} y1="0" x2={r} y2="0" stroke="#111" strokeWidth="2" />
      <circle cx="0" cy="0" r={r} fill="none" stroke="#111" strokeWidth="2.5" />
    </g>
  );
}

/* ── Corner label ────────────────────────────────────────────── */
function CornerLabel({ x, y, rotate, label, fontSize, textColor, isAction }) {
  const display = isAction
    ? ({ skip: '⊘', reverse: '↺', plus2: '+2', wild: 'W', wild_plus4: 'W' }[label] || label)
    : label;
  return (
    <text
      x={x} y={y}
      transform={`rotate(${rotate}, ${x}, ${y})`}
      textAnchor="middle" dominantBaseline="middle"
      fontSize={fontSize} fontWeight="900"
      fontFamily="Arial Black, Impact, sans-serif"
      fill={textColor}
      style={{ userSelect: 'none' }}
    >
      {display}
    </text>
  );
}

/* ── Main UnoCard SVG component ─────────────────────────────── */
export default function UnoCard({ cardId, color, type, value, width = 120, className = '', style = {} }) {
  const W = 120;
  const H = 168;
  const scale = width / W;

  // ── Face-down back of card ────────────────────────────────
  if (type === 'back') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W * scale} height={H * scale}
        xmlns="http://www.w3.org/2000/svg" className={className}
        style={{ display: 'block', ...style }} role="img" aria-label="UNO card (face down)">
        <rect x="2" y="2" width={W-4} height={H-4} rx="12" ry="12" fill="#12122a" />
        <rect x="2" y="2" width={W-4} height={H-4} rx="12" ry="12" fill="none" stroke="#fff" strokeWidth="5" />
        <rect x="10" y="10" width={W-20} height={H-20} rx="8" ry="8"
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <ellipse cx={W/2} cy={H/2} rx="32" ry="46"
          fill="#c0392b" transform={`rotate(-25,${W/2},${H/2})`} />
        <text x={W/2} y={H/2+3} textAnchor="middle" dominantBaseline="middle"
          fontSize="18" fontWeight="900" letterSpacing="2"
          fontFamily="Arial Black, Impact, sans-serif" fill="#fff"
          style={{ userSelect: 'none' }}>UNO</text>
      </svg>
    );
  }

  const colorDef   = COLORS[color] || null;
  const bg         = colorDef ? colorDef.bg   : '#1a1a1a';
  const darkBg     = colorDef ? colorDef.dark : '#111';
  const textColor  = colorDef ? colorDef.text : '#fff';
  const isWild     = type === 'wild';
  const isNumber   = type === 'number';
  const isAction   = type === 'action';

  /* Corner label text */
  const cornerLabel = isNumber ? value
    : isAction ? value
    : isWild   ? 'W' : '';

  /* Center content */
  const renderCenter = () => {
    if (isNumber) {
      return (
        <>
          {/* Oval */}
          <ellipse cx={W / 2} cy={H / 2} rx={36} ry={50} fill={darkBg} transform={`rotate(-25,${W/2},${H/2})`} />
          <text
            x={W / 2} y={H / 2 + 3}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="52" fontWeight="900"
            fontFamily="Arial Black, Impact, sans-serif"
            fill={textColor}
            style={{ userSelect: 'none' }}
          >
            {value}
          </text>
        </>
      );
    }

    if (isAction) {
      const symColor = textColor;
      let symbol;
      if (value === 'skip')    symbol = <SkipSymbol    color={symColor} size={70} />;
      if (value === 'reverse') symbol = <ReverseSymbol color={symColor} size={70} />;
      if (value === 'plus2')   symbol = <DrawTwoSymbol color={symColor} size={70} />;
      return (
        <>
          <ellipse cx={W / 2} cy={H / 2} rx={36} ry={50} fill={darkBg} transform={`rotate(-25,${W/2},${H/2})`} />
          <g transform={`translate(${W/2}, ${H/2})`}>{symbol}</g>
        </>
      );
    }

    if (isWild) {
      return (
        <>
          {/* Four-color quadrant circle */}
          <g transform={`translate(${W/2}, ${H/2})`}>
            <WildQuadrant />
          </g>
          {/* WILD label */}
          <text
            x={W / 2} y={H / 2 + 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="17" fontWeight="900" letterSpacing="2"
            fontFamily="Arial Black, Impact, sans-serif"
            fill="#fff"
            stroke="#000" strokeWidth="0.8"
            style={{ userSelect: 'none' }}
          >
            WILD
          </text>
          {/* +4 badge for wild_plus4 */}
          {value === 'wild_plus4' && (
            <>
              <rect x={W/2 - 22} y={H/2 + 22} width={44} height={22} rx={5} fill="#1a1a1a" stroke="#fff" strokeWidth="1.5" />
              <text
                x={W / 2} y={H / 2 + 33}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="14" fontWeight="900"
                fontFamily="Arial Black, Impact, sans-serif"
                fill="#FFD700"
                style={{ userSelect: 'none' }}
              >
                +4
              </text>
            </>
          )}
        </>
      );
    }
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W * scale}
      height={H * scale}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', ...style }}
      role="img"
      aria-label={`UNO card: ${color ? color + ' ' : ''}${value}`}
    >
      {/* Card background */}
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="12" ry="12" fill={bg} />

      {/* White outer border */}
      <rect x="2" y="2" width={W - 4} height={H - 4} rx="12" ry="12"
        fill="none" stroke="#fff" strokeWidth="5" />

      {/* Inner dark border line */}
      <rect x="8" y="8" width={W - 16} height={H - 16} rx="9" ry="9"
        fill="none" stroke={darkBg} strokeWidth="2" opacity="0.5" />

      {/* Center content */}
      {renderCenter()}

      {/* Top-left corner label */}
      <CornerLabel
        x={14} y={18}
        rotate={0}
        label={cornerLabel}
        fontSize={isNumber ? 16 : 11}
        textColor={textColor}
        isAction={isAction || isWild}
      />

      {/* Bottom-right corner label (rotated 180°) */}
      <CornerLabel
        x={W - 14} y={H - 18}
        rotate={180}
        label={cornerLabel}
        fontSize={isNumber ? 16 : 11}
        textColor={textColor}
        isAction={isAction || isWild}
      />

      {/* UNO logo at bottom */}
      <text
        x={W / 2} y={H - 9}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="8" fontWeight="900" letterSpacing="1.5"
        fontFamily="Arial Black, Impact, sans-serif"
        fill={textColor} opacity="0.75"
        style={{ userSelect: 'none' }}
      >
        UNO
      </text>
    </svg>
  );
}

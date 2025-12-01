import React from 'react';

const AirdropBadge = ({ potential }) => {
    const { label, value, color } = potential;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '100px',
            background: `rgba(${hexToRgb(color)}, 0.1)`,
            border: `1px solid ${color}`,
            color: color,
            fontSize: '0.85rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
        }}>
            <span>{label}</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span>{value}</span>
        </div>
    );
};

// Helper to convert hex to rgb for rgba usage
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse r, g, b
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) return '255, 255, 255'; // Fallback

    return `${r}, ${g}, ${b}`;
}

export default AirdropBadge;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ColorName } from '../../types';
import { useColorPicker } from './useColorPicker';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import BlockVisual from '../BlockVisual/BlockVisual';
import './ColorPicker.css';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_NAMES: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

// Utility functions for color conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [r, g, b].map(x => {
    const hex = clamp(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const calculateOffset = (baseHex: string, targetHex: string): { r: number; g: number; b: number } => {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  if (!base || !target) return { r: 0, g: 0, b: 0 };
  return {
    r: target.r - base.r,
    g: target.g - base.g,
    b: target.b - base.b
  };
};

const applyOffset = (baseHex: string, offset: { r: number; g: number; b: number }): string => {
  const base = hexToRgb(baseHex);
  if (!base) return baseHex;
  return rgbToHex(base.r + offset.r, base.g + offset.g, base.b + offset.b);
};

const DEFAULT_COLORS: Record<ColorName, {
  background: string;
  borderTop: string;
  borderLeft: string;
  borderBottom: string;
  borderRight: string;
}> = {
  grey: {
    background: '#9e9e9e',
    borderTop: '#bcbcbc',
    borderLeft: '#adadad',
    borderBottom: '#808080',
    borderRight: '#8f8f8f'
  },
  red: {
    background: '#d63031',
    borderTop: '#e54d4e',
    borderLeft: '#dd3e3f',
    borderBottom: '#b01b1c',
    borderRight: '#c42526'
  },
  orange: {
    background: '#fd7e14',
    borderTop: '#ff993d',
    borderLeft: '#ff8c26',
    borderBottom: '#d16006',
    borderRight: '#e86f0d'
  },
  yellow: {
    background: '#fab005',
    borderTop: '#ffc533',
    borderLeft: '#ffbb1f',
    borderBottom: '#cf8f00',
    borderRight: '#e6a000'
  },
  green: {
    background: '#2f9e44',
    borderTop: '#4cc061',
    borderLeft: '#3eb053',
    borderBottom: '#1b7a32',
    borderRight: '#258c3b'
  },
  blue: {
    background: '#023f80',
    borderTop: '#2b5fa3',
    borderLeft: '#184f94',
    borderBottom: '#002352',
    borderRight: '#00306b'
  },
  purple: {
    background: '#7950f2',
    borderTop: '#9673ff',
    borderLeft: '#8863ff',
    borderBottom: '#5832cc',
    borderRight: '#6840e0'
  }
};

const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose }) => {
  const { colorOverrides, setColorOverride, resetColorOverrides, resetColorOverride } = useColorPicker();
  const { blockTheme } = useTetrixStateContext();
  const [selectedColor, setSelectedColor] = useState<ColorName | null>(null);
  const [autoAdjust, setAutoAdjust] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getCurrentColor = (color: ColorName, property: keyof typeof DEFAULT_COLORS[ColorName]) => {
    return colorOverrides[color]?.[property] || DEFAULT_COLORS[color][property];
  };

  const getOffsetFromBase = (color: ColorName, borderProperty: 'borderTop' | 'borderLeft' | 'borderBottom' | 'borderRight'): { r: number; g: number; b: number } => {
    const baseColor = getCurrentColor(color, 'background');
    const borderColor = getCurrentColor(color, borderProperty);
    return calculateOffset(baseColor, borderColor);
  };

  const handleColorChange = (color: ColorName, property: keyof typeof DEFAULT_COLORS[ColorName], value: string) => {
    setColorOverride(color, property, value);
    
    // If auto-adjust is enabled and we're changing the background, update all borders
    if (autoAdjust && property === 'background') {
      const offsets = {
        borderTop: getOffsetFromBase(color, 'borderTop'),
        borderLeft: getOffsetFromBase(color, 'borderLeft'),
        borderBottom: getOffsetFromBase(color, 'borderBottom'),
        borderRight: getOffsetFromBase(color, 'borderRight')
      };
      
      // Apply the same offsets to the new base color
      setColorOverride(color, 'borderTop', applyOffset(value, offsets.borderTop));
      setColorOverride(color, 'borderLeft', applyOffset(value, offsets.borderLeft));
      setColorOverride(color, 'borderBottom', applyOffset(value, offsets.borderBottom));
      setColorOverride(color, 'borderRight', applyOffset(value, offsets.borderRight));
    }
  };

  const handleOffsetChange = (color: ColorName, borderProperty: 'borderTop' | 'borderLeft' | 'borderBottom' | 'borderRight', channel: 'r' | 'g' | 'b', value: number) => {
    const baseColor = getCurrentColor(color, 'background');
    const currentOffset = getOffsetFromBase(color, borderProperty);
    const newOffset = { ...currentOffset, [channel]: value };
    const newBorderColor = applyOffset(baseColor, newOffset);
    setColorOverride(color, borderProperty, newBorderColor);
  };

  const handleResetColor = (color: ColorName) => {
    resetColorOverride(color);
  };

  const handleResetAll = () => {
    resetColorOverrides();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="color-picker-overlay" onClick={handleOverlayClick}>
      <div className="color-picker-content">
        <div className="color-picker-header">
          <h2>Color Picker</h2>
          <button className="close-button" onClick={onClose} title="Close color picker">
            ✕
          </button>
        </div>

        <div className="color-picker-body">
          <div className="color-list">
            {COLOR_NAMES.map((colorName) => (
              <div
                key={colorName}
                className={`color-item ${selectedColor === colorName ? 'selected' : ''}`}
                onClick={() => setSelectedColor(colorName)}
              >
                <div className="color-preview">
                  <BlockVisual block={{ color: colorName, isFilled: true }} size={40} theme={blockTheme} />
                </div>
                <div className="color-info">
                  <span className="color-name">{colorName.charAt(0).toUpperCase() + colorName.slice(1)}</span>
                  {colorOverrides[colorName] && (
                    <button
                      className="reset-color-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetColor(colorName);
                      }}
                      title="Reset to default"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedColor && (
            <div className="color-editor">
              <h3>{selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} Color</h3>
              
              <div className="color-editor-preview">
                <BlockVisual block={{ color: selectedColor, isFilled: true }} size={80} theme={blockTheme} />
              </div>

              <div className="auto-adjust-container">
                <label className="auto-adjust-label">
                  <input
                    type="checkbox"
                    checked={autoAdjust}
                    onChange={(e) => setAutoAdjust(e.target.checked)}
                  />
                  <span>Auto-adjust borders when background changes</span>
                </label>
              </div>

              <div className="color-inputs">
                <div className="color-input-group">
                  <label htmlFor="bg-color">Background</label>
                  <div className="input-with-preview">
                    <input
                      id="bg-color"
                      type="text"
                      value={getCurrentColor(selectedColor, 'background')}
                      onChange={(e) => handleColorChange(selectedColor, 'background', e.target.value)}
                      placeholder="#hex"
                    />
                    <input
                      type="color"
                      value={getCurrentColor(selectedColor, 'background')}
                      onChange={(e) => handleColorChange(selectedColor, 'background', e.target.value)}
                      className="color-swatch"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label htmlFor="border-top">Border Top (Light)</label>
                  <div className="offset-inputs">
                    {(['r', 'g', 'b'] as const).map((channel) => {
                      const offset = getOffsetFromBase(selectedColor, 'borderTop');
                      return (
                        <div key={channel} className="offset-input">
                          <span className="channel-label">{channel.toUpperCase()}</span>
                          <input
                            type="number"
                            min="-255"
                            max="255"
                            value={offset[channel]}
                            onChange={(e) => handleOffsetChange(selectedColor, 'borderTop', channel, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="input-with-preview hex-preview">
                    <input
                      type="text"
                      value={getCurrentColor(selectedColor, 'borderTop')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderTop', e.target.value)}
                      placeholder="#hex"
                      readOnly
                    />
                    <input
                      type="color"
                      value={getCurrentColor(selectedColor, 'borderTop')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderTop', e.target.value)}
                      className="color-swatch"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label htmlFor="border-left">Border Left</label>
                  <div className="offset-inputs">
                    {(['r', 'g', 'b'] as const).map((channel) => {
                      const offset = getOffsetFromBase(selectedColor, 'borderLeft');
                      return (
                        <div key={channel} className="offset-input">
                          <span className="channel-label">{channel.toUpperCase()}</span>
                          <input
                            type="number"
                            min="-255"
                            max="255"
                            value={offset[channel]}
                            onChange={(e) => handleOffsetChange(selectedColor, 'borderLeft', channel, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="input-with-preview hex-preview">
                    <input
                      type="text"
                      value={getCurrentColor(selectedColor, 'borderLeft')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderLeft', e.target.value)}
                      placeholder="#hex"
                      readOnly
                    />
                    <input
                      type="color"
                      value={getCurrentColor(selectedColor, 'borderLeft')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderLeft', e.target.value)}
                      className="color-swatch"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label htmlFor="border-bottom">Border Bottom (Dark)</label>
                  <div className="offset-inputs">
                    {(['r', 'g', 'b'] as const).map((channel) => {
                      const offset = getOffsetFromBase(selectedColor, 'borderBottom');
                      return (
                        <div key={channel} className="offset-input">
                          <span className="channel-label">{channel.toUpperCase()}</span>
                          <input
                            type="number"
                            min="-255"
                            max="255"
                            value={offset[channel]}
                            onChange={(e) => handleOffsetChange(selectedColor, 'borderBottom', channel, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="input-with-preview hex-preview">
                    <input
                      type="text"
                      value={getCurrentColor(selectedColor, 'borderBottom')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderBottom', e.target.value)}
                      placeholder="#hex"
                      readOnly
                    />
                    <input
                      type="color"
                      value={getCurrentColor(selectedColor, 'borderBottom')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderBottom', e.target.value)}
                      className="color-swatch"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label htmlFor="border-right">Border Right</label>
                  <div className="offset-inputs">
                    {(['r', 'g', 'b'] as const).map((channel) => {
                      const offset = getOffsetFromBase(selectedColor, 'borderRight');
                      return (
                        <div key={channel} className="offset-input">
                          <span className="channel-label">{channel.toUpperCase()}</span>
                          <input
                            type="number"
                            min="-255"
                            max="255"
                            value={offset[channel]}
                            onChange={(e) => handleOffsetChange(selectedColor, 'borderRight', channel, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="input-with-preview hex-preview">
                    <input
                      type="text"
                      value={getCurrentColor(selectedColor, 'borderRight')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderRight', e.target.value)}
                      placeholder="#hex"
                      readOnly
                    />
                    <input
                      type="color"
                      value={getCurrentColor(selectedColor, 'borderRight')}
                      onChange={(e) => handleColorChange(selectedColor, 'borderRight', e.target.value)}
                      className="color-swatch"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="color-picker-footer">
          <button className="reset-all-button" onClick={handleResetAll}>
            Reset All Colors
          </button>
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ColorPicker;

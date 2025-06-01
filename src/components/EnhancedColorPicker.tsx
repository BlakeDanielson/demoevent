'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { ChevronDown, Palette } from 'lucide-react';

interface EnhancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
  className?: string;
  disabled?: boolean;
}

const DEFAULT_PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
];

export const EnhancedColorPicker: React.FC<EnhancedColorPickerProps> = ({
  color,
  onChange,
  label,
  presetColors = DEFAULT_PRESET_COLORS,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color);
  }, [color]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorChange = (colorResult: ColorResult) => {
    const newColor = colorResult.hex;
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handleInputBlur = () => {
    // Reset to current color if invalid
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(color);
    }
  };

  const handlePresetClick = (presetColor: string) => {
    setInputValue(presetColor);
    onChange(presetColor);
  };

  const togglePicker = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* Color Preview Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={togglePicker}
          disabled={disabled}
          className={`
            relative w-12 h-10 rounded-md border-2 border-gray-300 overflow-hidden
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
          style={{ backgroundColor: color }}
        >
          {/* Pattern for transparency indication */}
          <div className="absolute inset-0 bg-checkerboard opacity-20" />
          
          {/* Picker icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Palette className="h-4 w-4 text-white drop-shadow-sm" />
          </div>
          
          {/* Dropdown indicator */}
          <ChevronDown className="absolute bottom-0 right-0 h-3 w-3 text-gray-600 bg-white rounded-tl" />
        </button>

        {/* Hex Input */}
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            placeholder="#000000"
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${!/^#[0-9A-F]{6}$/i.test(inputValue) && inputValue !== '' ? 'border-red-300 bg-red-50' : ''}
            `}
          />
        </div>
      </div>

      {/* Preset Colors */}
      {presetColors.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Quick Colors:</p>
          <div className="flex flex-wrap gap-1">
            {presetColors.map((presetColor, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(presetColor)}
                disabled={disabled}
                className={`
                  w-6 h-6 rounded border border-gray-300 hover:border-gray-400
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${color === presetColor ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Picker Popup */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          <SketchPicker
            color={color}
            onChange={handleColorChange}
            presetColors={presetColors}
            disableAlpha={true}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedColorPicker; 
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  children, 
  className = '', 
  style = {}, 
  disabled = false,
  placeholder = "Seleccionar..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse children to extract options
  const options = [];
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && child.type === 'option') {
      options.push({
        value: child.props.value,
        label: child.props.children
      });
    }
  });

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value) || null;

  const handleSelect = (optionValue) => {
    if (onChange) {
      // Simulate native event structure so existing code doesn't break
      onChange({ target: { value: optionValue } });
    }
    setIsOpen(false);
  };

  // Extract appearance styles to prevent double-boxing when replacing native selects
  const {
    border,
    padding,
    background,
    backgroundColor,
    borderRadius,
    outline,
    minHeight,
    height,
    ...containerStyle
  } = style;

  // Remove global input classes that cause double-borders when applied to the container
  const safeClassName = className.replace(/\b(form-control|form-select|simple-input)\b/g, '').trim();

  return (
    <div 
      ref={containerRef} 
      className={`custom-select-container ${safeClassName}`} 
      style={{ position: 'relative', width: '100%', ...containerStyle }}
    >
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--border-color)'}`,
          background: disabled ? 'var(--bg-body)' : 'var(--bg-input)',
          color: disabled ? 'var(--text-muted)' : 'var(--text-main)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px',
          boxShadow: isOpen ? '0 0 0 3px var(--color-primary-alpha)' : 'none',
          minHeight: '42px', // standard input height
          userSelect: 'none'
        }}
      >
        <span style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          opacity: selectedOption ? 1 : 0.6
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: 'var(--text-muted)', 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </div>

      {isOpen && !disabled && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={`${opt.value}-${index}`}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-input)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                  background: isSelected ? 'var(--color-primary-alpha)' : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.1s',
                  marginBottom: '2px'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {opt.label}
                </span>
                {isSelected && <Check size={16} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

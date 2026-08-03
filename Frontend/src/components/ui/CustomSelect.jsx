import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  children, 
  className = '', 
  style = {}, 
  disabled = false,
  placeholder = "Seleccionar...",
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, direction: 'down' });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both container and dropdown portal
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = (e) => {
      // Close on scroll unless scrolling inside the dropdown itself
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true); // true = capture phase to catch all scrolls
      window.addEventListener('resize', () => setIsOpen(false));
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 200px below and more space above, open upwards
      const direction = (spaceBelow < 250 && spaceAbove > spaceBelow) ? 'up' : 'down';
      
      setDropdownPos({
        top: direction === 'down' ? rect.bottom + window.scrollY : rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        direction
      });
    }
    setIsOpen(!isOpen);
  };

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
      onChange({ target: { name, value: optionValue } });
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

  // Find the current theme node so CSS variables are inherited
  const portalNode = typeof document !== 'undefined' ? (document.querySelector('.admin-theme') || document.querySelector('.admin-theme-dark') || document.querySelector('.pos-theme') || document.querySelector('.pos-theme-dark') || document.body) : null;

  return (
    <div 
      ref={containerRef} 
      className={`custom-select-container ${safeClassName}`} 
      style={{ position: 'relative', width: '100%', ...containerStyle }}
    >
      <div 
        onClick={toggleDropdown}
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
          whiteSpace: 'normal', 
          wordBreak: 'break-word',
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

      {isOpen && !disabled && createPortal(
        <div 
          ref={dropdownRef}
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: dropdownPos.direction === 'down' ? `${dropdownPos.top + 4}px` : 'auto',
            bottom: dropdownPos.direction === 'up' ? `${window.innerHeight - dropdownPos.top + 4}px` : 'auto',
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 999999,
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
                <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', paddingRight: '8px' }}>
                  {opt.label}
                </span>
                {isSelected && <Check size={16} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>,
        portalNode
      )}
    </div>
  );
}

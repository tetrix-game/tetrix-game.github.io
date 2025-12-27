import React from 'react';

export type DebugTool = 'add-block' | 'fill-row' | 'fill-column' | 'remove';

export interface MenuSectionProps {
  id: 'tools' | 'color' | 'shapes' | 'view';
  label: string;
  icon: string | React.ReactNode;
  isFocused: boolean;
  isExpanded: boolean;
  onClick: () => void;

  // Optional color class for color button
  colorClass?: string;

  // Render the expanded bubble content
  renderContent?: () => React.ReactNode;
}

export const DebugMenuSection: React.FC<MenuSectionProps> = ({
  id,
  label,
  icon,
  isFocused,
  isExpanded,
  onClick,
  colorClass,
  renderContent,
}) => {

  return (
    <>
      {/* Section button */}
      <button
        className={`debug-compact-button ${isFocused ? 'focused' : ''} ${isExpanded ? 'expanded' : ''} ${id === 'color' ? `debug-color-button ${colorClass || ''}` : ''}`}
        onClick={onClick}
        title={label}
      >
        {typeof icon === 'string' ? (
          <span className="debug-button-icon">{icon}</span>
        ) : (
          icon
        )}
      </button>

      {/* Expanded content bubble */}
      {isExpanded && renderContent && (
        <div className="debug-bubble">
          <div className="debug-bubble-label">{label}</div>
          {renderContent()}
        </div>
      )}
    </>
  );
};

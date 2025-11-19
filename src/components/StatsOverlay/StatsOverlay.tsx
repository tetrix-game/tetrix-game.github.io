
import React from 'react';
import { useTetrixStateContext } from '../Tetrix/TetrixContext';
import { StatCategory } from '../../types/stats';
import { ColorName } from '../../types/core';
import './StatsOverlay.css';

interface StatsOverlayProps {
  onClose: () => void;
}

const CATEGORY_GROUPS: { title: string; categories: StatCategory[]; className?: string }[] = [
  {
    title: "General",
    categories: ['shapesPlaced', 'linesCleared'],
    className: "stats-group-general"
  },
  {
    title: "Rows",
    categories: [
      'rowsCleared',
      'doubleRows',
      'tripleRows',
      'quadrupleRows',
      'doubleRowsWithSingleColumns',
      'tripleRowsWithSingleColumns',
      'tripleRowsWithDoubleColumns',
      'quadrupleRowsWithSingleColumns'
    ]
  },
  {
    title: "Columns",
    categories: [
      'columnsCleared',
      'doubleColumns',
      'tripleColumns',
      'quadrupleColumns',
      'doubleColumnsWithSingleRows',
      'tripleColumnsWithDoubleRows',
      'tripleColumnsWithSingleRows',
      'quadrupleColumnsWithSingleRows'
    ]
  },
  {
    title: "Squares",
    categories: [
      'singleColumnBySingleRow',
      'doubleColumnByDoubleRow'
    ]
  },
  {
    title: "Legendary",
    categories: ['quadrupleRowByQuadrupleColumn'],
    className: "stats-group-legendary"
  }
];

const CATEGORY_LABELS: Record<StatCategory, string> = {
  shapesPlaced: "Shapes Placed",
  linesCleared: "Lines Cleared",
  rowsCleared: "Rows Cleared",
  doubleRows: "2R",
  tripleRows: "3R",
  quadrupleRows: "4R",
  doubleRowsWithSingleColumns: "2R x 1C",
  tripleRowsWithSingleColumns: "3R x 1C",
  tripleRowsWithDoubleColumns: "3R x 2C",
  quadrupleRowsWithSingleColumns: "4R x 1C",
  columnsCleared: "Columns Cleared",
  doubleColumns: "2C",
  tripleColumns: "3C",
  quadrupleColumns: "4C",
  doubleColumnsWithSingleRows: "2C x 1R",
  tripleColumnsWithDoubleRows: "3C x 2R",
  tripleColumnsWithSingleRows: "3C x 1R",
  quadrupleColumnsWithSingleRows: "4C x 1R",
  singleColumnBySingleRow: "1R x 1C",
  doubleColumnByDoubleRow: "2R x 2C",
  quadrupleRowByQuadrupleColumn: "4R x 4C"
};

const COLORS: ColorName[] = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'cyan', 'magenta'];

const StatsOverlay: React.FC<StatsOverlayProps> = ({ onClose }) => {
  const { stats } = useTetrixStateContext();

  const renderStatRow = (category: StatCategory) => {
    const allTime = stats.allTime[category];
    const highScore = stats.highScore[category];
    const current = stats.current[category];

    // Only show if there is some data all time
    if (allTime.total === 0) return null;

    const isNewRecord = current.total > 0 && current.total >= highScore.total;

    return (
      <div key={category} className="stat-row-container">
        <div className="stat-row main-stat">
          <div className="stat-label">{CATEGORY_LABELS[category]}</div>
          <div className="stat-value">{allTime.total}</div>
          <div className="stat-value">{highScore.total}</div>
          <div className={`stat-value ${isNewRecord ? 'highlight' : ''}`}>
            {current.total}
            {isNewRecord && current.total > 0 && <span className="streak-indicator">★</span>}
          </div>
        </div>
        
        {/* Color breakdown */}
        {COLORS.map(color => {
          const colorTotal = allTime.colors[color] || 0;
          if (colorTotal === 0) return null;

          const colorCurrent = current.colors[color] || 0;
          const colorHigh = highScore.colors[color] || 0;
          const isColorRecord = colorCurrent > 0 && colorCurrent >= colorHigh;

          return (
            <div key={`${category}-${color}`} className="stat-row color-stat" style={{ '--stat-color': `var(--color-${color})` } as React.CSSProperties}>
              <div className="stat-label" style={{ color: `var(--color-${color})` }}>
                ↳ {color.charAt(0).toUpperCase() + color.slice(1)}
              </div>
              <div className="stat-value">{colorTotal}</div>
              <div className="stat-value">{colorHigh}</div>
              <div className={`stat-value ${isColorRecord ? 'highlight' : ''}`}>
                {colorCurrent}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="stats-overlay-backdrop" onClick={onClose}>
      <div className="stats-overlay-content" onClick={e => e.stopPropagation()}>
        <div className="stats-header">
          <h2>Statistics</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="stats-table-header">
          <div className="header-label">Category</div>
          <div className="header-value">All Time</div>
          <div className="header-value">Best</div>
          <div className="header-value">Current</div>
        </div>

        <div className="stats-scroll-container">
          {CATEGORY_GROUPS.map((group, index) => {
            const rows = group.categories.map(renderStatRow).filter(Boolean);
            if (rows.length === 0) return null;

            return (
              <div key={group.title} className={`stats-group ${group.className || ''}`}>
                {index > 0 && <div className={`group-divider ${group.className === 'stats-group-legendary' ? 'legendary-divider' : ''}`} />}
                {/* <div className="group-title">{group.title}</div> */}
                {rows}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;

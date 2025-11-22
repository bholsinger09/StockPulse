import React from 'react';
import './StockCard.css';

const StockCard = ({ stock }) => {
  const isPositive = stock.change >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h2 className="stock-symbol">{stock.symbol}</h2>
        <span className={`stock-change ${changeClass}`}>
          {arrow} {Math.abs(stock.changePercent)}%
        </span>
      </div>
      <div className="stock-price">${stock.price.toFixed(2)}</div>
      <div className="stock-details">
        <span className={`change-value ${changeClass}`}>
          {isPositive ? '+' : ''}{stock.change?.toFixed(2) || '0.00'}
        </span>
      </div>
    </div>
  );
};

export default StockCard;

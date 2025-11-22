// Stock price simulator
class StockSimulator {
  constructor() {
    this.stocks = [
      { symbol: 'AAPL', price: 175.50, volatility: 0.02 },
      { symbol: 'GOOGL', price: 140.25, volatility: 0.025 },
      { symbol: 'MSFT', price: 380.75, volatility: 0.018 },
      { symbol: 'AMZN', price: 155.30, volatility: 0.022 },
      { symbol: 'TSLA', price: 242.80, volatility: 0.035 },
      { symbol: 'META', price: 485.20, volatility: 0.028 },
      { symbol: 'NVDA', price: 495.50, volatility: 0.03 },
      { symbol: 'NFLX', price: 475.60, volatility: 0.026 }
    ];
  }

  // Generate a random price change based on volatility
  generatePriceChange(currentPrice, volatility) {
    const change = currentPrice * volatility * (Math.random() - 0.5) * 2;
    return change;
  }

  // Update all stock prices
  updatePrices() {
    const timestamp = Date.now();

    this.stocks = this.stocks.map(stock => {
      const change = this.generatePriceChange(stock.price, stock.volatility);
      const newPrice = Math.max(stock.price + change, 0.01); // Prevent negative prices
      const changePercent = ((newPrice - stock.price) / stock.price) * 100;

      return {
        ...stock,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        timestamp
      };
    });

    return this.stocks;
  }

  // Get current stock prices
  getCurrentPrices() {
    return this.stocks.map(stock => ({
      ...stock,
      timestamp: Date.now()
    }));
  }
}

export default StockSimulator;

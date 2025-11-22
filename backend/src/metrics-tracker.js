// Performance metrics tracker
class MetricsTracker {
  constructor() {
    this.connections = 0;
    this.messagesSent = 0;
    this.startTime = Date.now();
    this.messageTimestamps = [];
    this.MAX_TIMESTAMPS = 1000; // Keep last 1000 message timestamps
  }

  addConnection() {
    this.connections++;
  }

  removeConnection() {
    this.connections--;
  }

  recordMessage() {
    this.messagesSent++;
    const now = Date.now();
    this.messageTimestamps.push(now);

    // Keep only recent timestamps
    if (this.messageTimestamps.length > this.MAX_TIMESTAMPS) {
      this.messageTimestamps.shift();
    }
  }

  // Calculate messages per second over the last window
  getMessagesPerSecond(windowSeconds = 5) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    const recentMessages = this.messageTimestamps.filter(ts => ts >= cutoff);
    return recentMessages.length / windowSeconds;
  }

  // Get current metrics
  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const messagesPerSecond = this.getMessagesPerSecond();
    const throughput = Math.floor(messagesPerSecond);

    return {
      connections: this.connections,
      totalMessagesSent: this.messagesSent,
      messagesPerSecond: parseFloat(messagesPerSecond.toFixed(2)),
      throughput,
      uptime
    };
  }

  reset() {
    this.messagesSent = 0;
    this.startTime = Date.now();
    this.messageTimestamps = [];
  }
}

export default MetricsTracker;

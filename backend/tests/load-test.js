import WebSocket from 'ws';

class LoadTester {
  constructor(url, options = {}) {
    this.url = url;
    this.clients = [];
    this.options = {
      numClients: options.numClients || 10,
      duration: options.duration || 30000, // 30 seconds
      verbose: options.verbose || false
    };
    this.stats = {
      messagesReceived: 0,
      errors: 0,
      totalLatency: 0,
      latencyReadings: 0,
      startTime: null,
      endTime: null
    };
  }

  log(message) {
    if (this.options.verbose) {
      console.log(message);
    }
  }

  async createClient(id) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.url);
        let pingInterval;
        let lastPingTime = 0;

        ws.on('open', () => {
          this.log(`Client ${id} connected`);

          // Send periodic pings
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              lastPingTime = Date.now();
              ws.send(JSON.stringify({
                type: 'ping',
                clientTime: lastPingTime
              }));
            }
          }, 5000);

          resolve({ ws, pingInterval });
        });

        ws.on('message', (data) => {
          this.stats.messagesReceived++;

          try {
            const message = JSON.parse(data.toString());

            // Calculate latency from pong messages
            if (message.type === 'pong' && lastPingTime > 0) {
              const latency = Date.now() - lastPingTime;
              this.stats.totalLatency += latency;
              this.stats.latencyReadings++;
            }
          } catch (err) {
            this.log(`Client ${id} parse error: ${err.message}`);
          }
        });

        ws.on('error', (error) => {
          this.stats.errors++;
          this.log(`Client ${id} error: ${error.message}`);
        });

        ws.on('close', () => {
          if (pingInterval) {
            clearInterval(pingInterval);
          }
          this.log(`Client ${id} disconnected`);
        });

      } catch (error) {
        this.stats.errors++;
        reject(error);
      }
    });
  }

  async start() {
    console.log('\n🚀 Starting Load Test');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Configuration:`);
    console.log(`   URL: ${this.url}`);
    console.log(`   Clients: ${this.options.numClients}`);
    console.log(`   Duration: ${this.options.duration / 1000}s`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    this.stats.startTime = Date.now();

    // Create all clients
    console.log('Creating clients...');
    const clientPromises = [];

    for (let i = 0; i < this.options.numClients; i++) {
      clientPromises.push(this.createClient(i + 1));
      // Stagger connection creation slightly
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      this.clients = await Promise.all(clientPromises);
      console.log(`✅ ${this.clients.length} clients connected\n`);
    } catch (error) {
      console.error('❌ Error creating clients:', error.message);
      return;
    }

    // Run for specified duration
    console.log(`⏱️  Running test for ${this.options.duration / 1000} seconds...\n`);

    // Show progress updates
    const progressInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
      const messagesPerSec = (this.stats.messagesReceived / (elapsed || 1)).toFixed(2);
      process.stdout.write(`   Elapsed: ${elapsed}s | Messages: ${this.stats.messagesReceived} | Rate: ${messagesPerSec}/s\r`);
    }, 1000);

    await new Promise(resolve => setTimeout(resolve, this.options.duration));

    clearInterval(progressInterval);
    console.log('\n\n⏹️  Test complete, closing connections...');

    // Close all clients
    this.clients.forEach(({ ws, pingInterval }) => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.stats.endTime = Date.now();
    this.printResults();
  }

  printResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const messagesPerSecond = (this.stats.messagesReceived / duration).toFixed(2);
    const avgLatency = this.stats.latencyReadings > 0
      ? (this.stats.totalLatency / this.stats.latencyReadings).toFixed(2)
      : 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Load Test Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Test Summary:`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    console.log(`   Concurrent Clients: ${this.options.numClients}`);
    console.log(`\n📨 Message Statistics:`);
    console.log(`   Total Messages: ${this.stats.messagesReceived}`);
    console.log(`   Messages/Second: ${messagesPerSecond}`);
    console.log(`   Throughput: ${(messagesPerSecond * this.options.numClients).toFixed(2)} total msg/s`);
    console.log(`\n⚡ Performance:`);
    console.log(`   Average Latency: ${avgLatency}ms`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  numClients: 10,
  duration: 30000,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--clients':
    case '-c':
      options.numClients = parseInt(args[++i]) || 10;
      break;
    case '--duration':
    case '-d':
      options.duration = (parseInt(args[++i]) || 30) * 1000;
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--help':
    case '-h':
      console.log(`
StockPulse Load Tester

Usage: node load-test.js [options]

Options:
  -c, --clients <n>     Number of concurrent clients (default: 10)
  -d, --duration <s>    Test duration in seconds (default: 30)
  -v, --verbose         Enable verbose logging
  -h, --help            Show this help message

Examples:
  node load-test.js --clients 50 --duration 60
  node load-test.js -c 100 -d 120 -v
      `);
      process.exit(0);
  }
}

// Run the load test
const WS_URL = process.env.WS_URL || 'ws://localhost:3001/ws';
const tester = new LoadTester(WS_URL, options);

tester.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

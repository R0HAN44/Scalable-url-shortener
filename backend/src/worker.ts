import { startAnalyticsWorker } from "./workers/analytics.worker";

async function main() {
  try {
    const worker = startAnalyticsWorker();
    
    console.log('Analytics worker is now processing jobs...');
    console.log('Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

main();
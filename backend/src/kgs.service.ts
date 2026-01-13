import express from "express";
import { reserveKeyRange } from "./modules/short_code_generation/short_code_generation.repository";
import { encodeBase64 } from "./utils/short_code_generator.util";

class KgsService {
  private keysPool: string[] = [];
  private isRefilling = false;

  constructor(
    private readonly batchSize = 10_000,
    private readonly refillThreshold = 0.2
  ) {}

  async start() {
    await this.refill();
  }

  getKey(): string {
    const key = this.keysPool.pop();
    if (!key) {
      throw new Error("No keys available");
    }

    if (this.keysPool.length < this.batchSize * this.refillThreshold) {
      this.refill().catch(console.error);
    }

    return key;
  }

  private async refill() {
    if (this.isRefilling) return;
    this.isRefilling = true;

    try {
      const [start, end] = await reserveKeyRange(this.batchSize);
      for (let i = start; i <= end; i++) {
        this.keysPool.push(encodeBase64(i));
      }
    } finally {
      this.isRefilling = false;
    }
  }
}

const kgsService = new KgsService();

const app = express();
const PORT = process.env.KGS_PORT || 4000;

app.get("/next-key", (_req, res) => {
  try {
    const key = kgsService.getKey();
    res.json({ key });
  } catch (err) {
    res.status(503).json({ error: "KGS unavailable" });
  }
});

async function main() {
  await kgsService.start();

  app.listen(PORT, () => {
    console.log(`KGS running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start kgs server", err);
  process.exit(1);
});
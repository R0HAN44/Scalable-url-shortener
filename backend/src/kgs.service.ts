import { encodeBase64 } from "./utils/short_code_generator.util";

export class KgsService {
    private keysPool: string[] = [];

    private isRefilling: boolean = false;
    private isShuttingDown: boolean = false;
    private initialized: boolean = false;

    private readonly batchSize: number;
    private readonly refillThreshold: number;

    constructor(
        private readonly db: { reserveRange: (count: number) => Promise<[number, number]> },
        batchSize = 10000,
        refillThreshold = 0.2
    ) {
        this.batchSize = batchSize;
        this.refillThreshold = refillThreshold;
    }

    async start(): Promise<void> {
        await this.refillKeysPool();
        this.initialized = true;
    }

    async shutdown(): Promise<void> {
        this.isShuttingDown = true;
    }

    getNextKey(): string {
        if (this.isShuttingDown) {
            throw new Error("Service is shutting down");
        }
        if (!this.initialized) {
            throw new Error("Service not initialized");
        }
        if (this.isRefilling) {
            throw new Error("Service is refilling keys");
        }
        const key = this.keysPool.pop();
        if (!key) {
            throw new Error("No keys available");
        }

        if (this.keysPool.length < this.batchSize * this.refillThreshold) {
            this.refillKeysPool().catch(() => {});
        }
        return key;
    }

    private async refillKeysPool(): Promise<void> {
        if(this.isRefilling || this.isShuttingDown) {
            return;
        }

        this.isRefilling = true;
        try {
            const [start, end] = await this.db.reserveRange(this.batchSize);
            const newKeys: string[] = [];
            for (let i = start; i <= end; i++) {
                newKeys.push(encodeBase64(i));
            }
            this.keysPool.push(...newKeys);
        } catch (error) {
            console.error("Error refilling keys pool:", error);
        } finally {
            this.isRefilling = false;
        }
    }
}
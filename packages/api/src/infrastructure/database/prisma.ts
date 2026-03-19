import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
    // eslint-disable-next-line no-var
    var __andromedaPrisma: PrismaClient | undefined;
}

export function hasPrismaDatabaseUrl(): boolean {
    return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.trim().length > 0;
}

export function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is required to use Prisma-backed sandbox repositories.");
    }

    const adapter = new PrismaPg({ connectionString });
    return globalThis.__andromedaPrisma || new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient {
    if (!globalThis.__andromedaPrisma) {
        globalThis.__andromedaPrisma = createPrismaClient();
    }

    return globalThis.__andromedaPrisma;
}

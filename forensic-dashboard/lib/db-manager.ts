import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private connectionCount = 0;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getClient(): Promise<PrismaClient> {
    try {
      // Connect if not already connected
      await this.prisma.$connect();
      this.connectionCount++;
      console.log(`[DB] Connection opened (count: ${this.connectionCount})`);
      return this.prisma;
    } catch (error) {
      console.error('[DB] Connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connectionCount > 0) {
        this.connectionCount--;
        console.log(`[DB] Connection closed (count: ${this.connectionCount})`);
      }
      
      // Only disconnect if no active connections
      if (this.connectionCount <= 0) {
        await this.prisma.$disconnect();
        console.log('[DB] Prisma disconnected');
      }
    } catch (error) {
      console.error('[DB] Disconnect error:', error);
    }
  }

  public async withTransaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      const result = await operation(client);
      return result;
    } catch (error) {
      console.error('[DB] Transaction error:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.$queryRaw`SELECT 1`;
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('[DB] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Fallback to original prisma client for compatibility
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await dbManager.disconnect();
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await dbManager.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await dbManager.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });
}
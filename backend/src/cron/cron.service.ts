import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Daily at 8 AM — Check for low stock inventory items
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowStockAlerts() {
    this.logger.log('🔔 Running daily low-stock inventory check...');

    try {
      const lowStockItems = await this.prisma.$queryRaw`
        SELECT id, sku, name, quantity, "reorderLevel"
        FROM inventory_items
        WHERE "isDeleted" = false AND quantity <= "reorderLevel"
      ` as any[];

      if (lowStockItems.length > 0) {
        this.logger.warn(
          `⚠️ ${lowStockItems.length} items below reorder level:`,
        );
        lowStockItems.forEach((item: any) => {
          this.logger.warn(
            `  → ${item.sku} (${item.name}): ${item.quantity}/${item.reorderLevel}`,
          );
        });

        // Cache the alert data for the dashboard
        await this.redis.setJson('alerts:low-stock', {
          count: lowStockItems.length,
          items: lowStockItems,
          checkedAt: new Date().toISOString(),
        }, 86400); // 24 hours
      } else {
        this.logger.log('✅ All inventory items are above reorder levels');
      }
    } catch (error) {
      this.logger.error('Failed to check low stock alerts', error);
    }
  }

  /**
   * Every Monday at 6 AM — Generate weekly procurement summary
   */
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyProcurementSummary() {
    this.logger.log('📊 Generating weekly procurement summary...');

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyOrders = await this.prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        include: {
          supplier: { select: { name: true } },
          items: true,
        },
      });

      const summary = {
        period: `${oneWeekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        totalOrders: weeklyOrders.length,
        totalAmount: weeklyOrders.reduce((sum: number, o: { totalAmount: number }) => sum + o.totalAmount, 0),
        byStatus: weeklyOrders.reduce((acc: Record<string, number>, o: { status: string }) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      // Auto-generate the report record
      const firstAdmin = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (firstAdmin) {
        await this.prisma.report.create({
          data: {
            title: `Weekly Procurement Summary — ${summary.period}`,
            type: 'PROCUREMENT',
            data: summary,
            generatedById: firstAdmin.id,
          },
        });
      }

      this.logger.log(
        `✅ Weekly summary: ${summary.totalOrders} orders, $${summary.totalAmount.toFixed(2)} total`,
      );
    } catch (error) {
      this.logger.error('Failed to generate weekly summary', error);
    }
  }

  /**
   * Every night at 2 AM — Reconcile Redis cache with DB state
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async reconcileCache() {
    this.logger.log('🔄 Running nightly cache reconciliation...');

    try {
      // Invalidate all cached data to force fresh reads
      await this.redis.invalidatePattern('inventory:*');
      await this.redis.invalidatePattern('reports:*');

      this.logger.log('✅ Cache reconciliation complete — all caches invalidated');
    } catch (error) {
      this.logger.error('Failed to reconcile cache', error);
    }
  }
}

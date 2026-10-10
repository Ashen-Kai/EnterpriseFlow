import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  private readonly CACHE_TTL = 600; // 10 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto & { type?: string }) {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: { generatedBy: { select: { id: true, name: true } } },
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.prisma.report.findUnique({
      where: { id },
      include: { generatedBy: { select: { id: true, name: true } } },
    });
  }

  async generateReport(type: string, userId: string) {
    let data: any;
    let title: string;

    switch (type) {
      case 'INVENTORY':
        data = await this.getInventoryReportData();
        title = `Inventory Report — ${new Date().toLocaleDateString()}`;
        break;
      case 'PROCUREMENT':
        data = await this.getProcurementReportData();
        title = `Procurement Report — ${new Date().toLocaleDateString()}`;
        break;
      case 'HR':
        data = await this.getHrReportData();
        title = `HR Report — ${new Date().toLocaleDateString()}`;
        break;
      case 'FINANCIAL':
        data = await this.getFinancialReportData();
        title = `Financial Report — ${new Date().toLocaleDateString()}`;
        break;
      default:
        title = `General Report — ${new Date().toLocaleDateString()}`;
        data = {};
    }

    const report = await this.prisma.report.create({
      data: {
        title,
        type: type as any,
        data,
        generatedById: userId,
      },
      include: { generatedBy: { select: { id: true, name: true } } },
    });

    this.logger.log(`Report generated: ${title}`);
    return report;
  }

  async getDashboardStats() {
    const cacheKey = 'reports:dashboard-stats';
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const [
      totalInventoryItems,
      lowStockCount,
      totalInventoryValue,
      pendingOrders,
      totalOrders,
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      recentOrders,
      recentLeaves,
    ] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { isDeleted: false } }),
      this.prisma.$queryRaw`SELECT COUNT(*) as count FROM inventory_items WHERE "isDeleted" = false AND quantity <= "reorderLevel"` as Promise<any>,
      this.prisma.$queryRaw`SELECT COALESCE(SUM(quantity * "unitPrice"), 0) as total FROM inventory_items WHERE "isDeleted" = false` as Promise<any>,
      this.prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.purchaseOrder.count(),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true } } },
      }),
      this.prisma.leaveRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { name: true, department: true } } },
      }),
    ]);

    const stats = {
      inventory: {
        totalItems: totalInventoryItems,
        lowStockCount: Number(lowStockCount?.[0]?.count || 0),
        totalValue: Number(totalInventoryValue?.[0]?.total || 0),
      },
      procurement: {
        pendingOrders,
        totalOrders,
      },
      hr: {
        totalEmployees,
        activeEmployees,
        pendingLeaves,
      },
      recentActivity: {
        orders: recentOrders,
        leaves: recentLeaves,
      },
    };

    await this.redis.setJson(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  private async getInventoryReportData() {
    const items = await this.prisma.inventoryItem.findMany({
      where: { isDeleted: false },
      include: { supplier: { select: { name: true } } },
      orderBy: { category: 'asc' },
    });

    const byCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = { count: 0, totalValue: 0 };
      acc[item.category].count++;
      acc[item.category].totalValue += item.quantity * item.unitPrice;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return { totalItems: items.length, byCategory, items };
  }

  private async getProcurementReportData() {
    const orders = await this.prisma.purchaseOrder.findMany({
      include: { supplier: { select: { name: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const byStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalSpend = orders
      .filter((o) => o.status === 'APPROVED' || o.status === 'RECEIVED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { totalOrders: orders.length, byStatus, totalSpend };
  }

  private async getHrReportData() {
    const employees = await this.prisma.employee.findMany({
      include: { leaveRequests: true },
    });

    const byDepartment = employees.reduce((acc, emp) => {
      if (!acc[emp.department]) acc[emp.department] = { count: 0, totalSalary: 0 };
      acc[emp.department].count++;
      acc[emp.department].totalSalary += emp.salary;
      return acc;
    }, {} as Record<string, { count: number; totalSalary: number }>);

    return { totalEmployees: employees.length, byDepartment };
  }

  private async getFinancialReportData() {
    const [inventoryValue, procurementSpend, totalPayroll] = await Promise.all([
      this.prisma.inventoryItem.aggregate({
        where: { isDeleted: false },
        _sum: { unitPrice: true },
      }),
      this.prisma.purchaseOrder.aggregate({
        where: { status: { in: ['APPROVED', 'RECEIVED'] } },
        _sum: { totalAmount: true },
      }),
      this.prisma.employee.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { salary: true },
      }),
    ]);

    return {
      inventoryValue: inventoryValue._sum.unitPrice || 0,
      procurementSpend: procurementSpend._sum.totalAmount || 0,
      monthlyPayroll: totalPayroll._sum.salary || 0,
    };
  }
}

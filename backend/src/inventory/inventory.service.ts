import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly CACHE_PREFIX = 'inventory';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: PaginationDto & { category?: string }) {
    const { page = 1, limit = 20, search, category } = query;
    const cacheKey = `${this.CACHE_PREFIX}:list:${page}:${limit}:${search || ''}:${category || ''}`;

    // Check cache
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for inventory list');
      return cached;
    }

    const skip = (page - 1) * limit;
    const where: any = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };

    // Cache result
    await this.redis.setJson(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id, isDeleted: false },
      include: { supplier: true },
    });

    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async create(dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: {
        ...dto,
        lastRestocked: new Date(),
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    await this.redis.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    this.logger.log(`Created inventory item: ${item.sku} - ${item.name}`);
    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto) {
    await this.findOne(id); // ensure exists

    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
      include: { supplier: { select: { id: true, name: true } } },
    });

    await this.redis.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    return item;
  }

  async softDelete(id: string) {
    await this.findOne(id);

    await this.prisma.inventoryItem.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.redis.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    return { message: 'Item deleted successfully' };
  }

  async getLowStockItems() {
    const cacheKey = `${this.CACHE_PREFIX}:low-stock`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    // Use raw query for the self-referencing comparison (quantity <= reorderLevel)
    const lowStockItems = await this.prisma.$queryRaw`
      SELECT i.*, s.name as "supplierName"
      FROM inventory_items i
      LEFT JOIN suppliers s ON i."supplierId" = s.id
      WHERE i."isDeleted" = false AND i.quantity <= i."reorderLevel"
      ORDER BY i.quantity ASC
    `;

    await this.redis.setJson(cacheKey, lowStockItems, 600);
    return lowStockItems;
  }

  async getCategories() {
    const categories = await this.prisma.inventoryItem.findMany({
      where: { isDeleted: false },
      select: { category: true },
      distinct: ['category'],
    });
    return categories.map((c) => c.category);
  }
}

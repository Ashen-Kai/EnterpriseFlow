import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, CreateSupplierDto, UpdateSupplierDto } from './dto/procurement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Purchase Orders ───────────────────────────────────

  async findAllOrders(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
          items: { include: { inventoryItem: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createOrder(dto: CreatePurchaseOrderDto, userId: string) {
    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const order = await this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: dto.supplierId,
        totalAmount,
        notes: dto.notes,
        createdById: userId,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { inventoryItem: { select: { id: true, name: true, sku: true } } } },
      },
    });

    this.logger.log(`Purchase order created: ${orderNumber} for $${totalAmount}`);
    return order;
  }

  async approveOrder(orderId: string, userId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Purchase order not found');
    if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
      throw new BadRequestException('Order cannot be approved in current status');
    }

    return this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'APPROVED', approvedById: userId },
      include: {
        supplier: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: status as any },
    });
  }

  // ─── Suppliers ─────────────────────────────────────────

  async findAllSuppliers(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}

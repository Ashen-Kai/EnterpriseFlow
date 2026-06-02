import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import { CreatePurchaseOrderDto, CreateSupplierDto, UpdateSupplierDto } from './dto/procurement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private procurementService: ProcurementService) {}

  // ─── Purchase Orders ───

  @Get('orders')
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'status', required: false })
  findAllOrders(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.procurementService.findAllOrders({ ...query, status });
  }

  @Post('orders')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create purchase order (Manager/Admin)' })
  createOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser('id') userId: string) {
    return this.procurementService.createOrder(dto, userId);
  }

  @Patch('orders/:id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approve purchase order (Manager/Admin)' })
  approveOrder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.procurementService.approveOrder(id, userId);
  }

  @Patch('orders/:id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.procurementService.updateOrderStatus(id, status);
  }

  // ─── Suppliers ───

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers' })
  findAllSuppliers(@Query() query: PaginationDto) {
    return this.procurementService.findAllSuppliers(query);
  }

  @Post('suppliers')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create supplier (Manager/Admin)' })
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Patch('suppliers/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update supplier (Manager/Admin)' })
  updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.procurementService.updateSupplier(id, dto);
  }
}

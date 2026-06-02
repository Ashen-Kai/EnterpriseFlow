import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items with pagination and search' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query() query: PaginationDto, @Query('category') category?: string) {
    return this.inventoryService.findAll({ ...query, category });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items below reorder level' })
  getLowStock() {
    return this.inventoryService.getLowStockItems();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all inventory categories' })
  getCategories() {
    return this.inventoryService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create inventory item (Manager/Admin)' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update inventory item (Manager/Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete inventory item (Admin only)' })
  remove(@Param('id') id: string) {
    return this.inventoryService.softDelete(id);
  }
}

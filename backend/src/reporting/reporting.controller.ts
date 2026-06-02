import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  @Get()
  @ApiOperation({ summary: 'List generated reports' })
  @ApiQuery({ name: 'type', required: false, enum: ['INVENTORY', 'PROCUREMENT', 'HR', 'FINANCIAL'] })
  findAll(@Query() query: PaginationDto, @Query('type') type?: string) {
    return this.reportingService.findAll({ ...query, type });
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get aggregated dashboard statistics' })
  getDashboardStats() {
    return this.reportingService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details' })
  findOne(@Param('id') id: string) {
    return this.reportingService.findOne(id);
  }

  @Post('generate')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Generate a report (Manager/Admin)' })
  generate(
    @Body('type') type: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportingService.generateReport(type, userId);
  }
}

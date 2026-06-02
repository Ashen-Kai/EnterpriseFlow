import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { CreateEmployeeDto, UpdateEmployeeDto, CreateLeaveRequestDto } from './dto/hr.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}

  // ─── Employees ───

  @Get('employees')
  @ApiOperation({ summary: 'List employees' })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAllEmployees(
    @Query() query: PaginationDto,
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.findAllEmployees({ ...query, department, status });
  }

  @Get('employees/departments')
  @ApiOperation({ summary: 'List all departments' })
  getDepartments() {
    return this.hrService.getDepartments();
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee details' })
  findOneEmployee(@Param('id') id: string) {
    return this.hrService.findOneEmployee(id);
  }

  @Post('employees')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create employee (Manager/Admin)' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Patch('employees/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update employee (Manager/Admin)' })
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  // ─── Leave Requests ───

  @Get('leave-requests')
  @ApiOperation({ summary: 'List leave requests' })
  @ApiQuery({ name: 'status', required: false })
  findAllLeaveRequests(@Query() query: PaginationDto, @Query('status') status?: string) {
    return this.hrService.findAllLeaveRequests({ ...query, status });
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Submit leave request' })
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    return this.hrService.createLeaveRequest(dto);
  }

  @Patch('leave-requests/:id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approve leave request (Manager/Admin)' })
  approveLeaveRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.hrService.approveLeaveRequest(id, userId, true);
  }

  @Patch('leave-requests/:id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reject leave request (Manager/Admin)' })
  rejectLeaveRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.hrService.approveLeaveRequest(id, userId, false);
  }
}

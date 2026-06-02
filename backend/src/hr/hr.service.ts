import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, CreateLeaveRequestDto } from './dto/hr.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Employees ─────────────────────────────────────────

  async findAllEmployees(query: PaginationDto & { department?: string; status?: string }) {
    const { page = 1, limit = 20, search, department, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.department = department;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneEmployee(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({
      data: {
        ...dto,
        dateOfJoining: new Date(dto.dateOfJoining),
      },
    });
    this.logger.log(`Employee created: ${employee.employeeCode} - ${employee.name}`);
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    await this.findOneEmployee(id);
    return this.prisma.employee.update({
      where: { id },
      data: dto as any,
    });
  }

  async getDepartments() {
    const departments = await this.prisma.employee.findMany({
      select: { department: true },
      distinct: ['department'],
    });
    return departments.map((d) => d.department);
  }

  // ─── Leave Requests ────────────────────────────────────

  async findAllLeaveRequests(query: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, name: true, employeeCode: true, department: true } },
          approvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createLeaveRequest(dto: CreateLeaveRequestDto) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true } },
      },
    });
  }

  async approveLeaveRequest(id: string, userId: string, approved: boolean) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedById: userId,
      },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });
  }
}

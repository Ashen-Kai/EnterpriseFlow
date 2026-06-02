import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@enterprise.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 'Senior Developer' })
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dateOfJoining: string;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  salary: number;

  @ApiPropertyOptional({ example: '+1-555-0123' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '456 Elm Street' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: ['CASUAL', 'SICK', 'EARNED', 'UNPAID'] })
  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @ApiProperty({ example: '2024-06-10' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-06-12' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Family event' })
  @IsOptional()
  @IsString()
  reason?: string;
}

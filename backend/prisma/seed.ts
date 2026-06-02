import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: {},
    create: {
      email: 'admin@enterprise.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      department: 'Administration',
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@enterprise.com' },
    update: {},
    create: {
      email: 'manager@enterprise.com',
      password: managerPassword,
      name: 'Operations Manager',
      role: 'MANAGER',
      department: 'Operations',
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 12);
  await prisma.user.upsert({
    where: { email: 'employee@enterprise.com' },
    update: {},
    create: {
      email: 'employee@enterprise.com',
      password: employeePassword,
      name: 'John Worker',
      role: 'EMPLOYEE',
      department: 'Engineering',
    },
  });

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Acme Industrial Supply',
        contactEmail: 'sales@acme-industrial.com',
        phone: '+1-555-0100',
        address: '123 Industrial Blvd, Chicago, IL',
        rating: 4.5,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'GlobalTech Components',
        contactEmail: 'orders@globaltech.com',
        phone: '+1-555-0200',
        address: '456 Tech Park Drive, San Jose, CA',
        rating: 4.2,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Prime Materials Co.',
        contactEmail: 'supply@primematerials.com',
        phone: '+1-555-0300',
        address: '789 Materials Way, Houston, TX',
        rating: 3.8,
      },
    }),
  ]);

  // Create inventory items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        sku: 'RM-001',
        name: 'Steel Bolt M10',
        description: 'Galvanized steel bolt, 10mm diameter, grade 8.8',
        category: 'Raw Materials',
        quantity: 5000,
        unitPrice: 0.45,
        reorderLevel: 500,
        supplierId: suppliers[0].id,
        lastRestocked: new Date('2024-05-20'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'RM-002',
        name: 'Copper Wire 2.5mm',
        description: 'Bare copper wire, 2.5mm diameter, 99.9% purity',
        category: 'Raw Materials',
        quantity: 200,
        unitPrice: 12.00,
        reorderLevel: 100,
        supplierId: suppliers[1].id,
        lastRestocked: new Date('2024-05-15'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'EQ-001',
        name: 'Industrial Servo Motor',
        description: 'AC servo motor, 750W, with encoder',
        category: 'Equipment',
        quantity: 15,
        unitPrice: 340.00,
        reorderLevel: 5,
        supplierId: suppliers[1].id,
        lastRestocked: new Date('2024-04-10'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'EQ-002',
        name: 'Pneumatic Cylinder',
        description: 'Double-acting pneumatic cylinder, 50mm bore',
        category: 'Equipment',
        quantity: 3,
        unitPrice: 89.00,
        reorderLevel: 10,
        supplierId: suppliers[2].id,
        lastRestocked: new Date('2024-03-22'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'SP-001',
        name: 'Safety Goggles',
        description: 'ANSI Z87.1 rated safety goggles, anti-fog',
        category: 'Safety',
        quantity: 150,
        unitPrice: 8.50,
        reorderLevel: 30,
        supplierId: suppliers[0].id,
        lastRestocked: new Date('2024-05-25'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'SP-002',
        name: 'Industrial Gloves',
        description: 'Cut-resistant industrial gloves, level A4',
        category: 'Safety',
        quantity: 75,
        unitPrice: 15.00,
        reorderLevel: 50,
        supplierId: suppliers[0].id,
        lastRestocked: new Date('2024-05-18'),
      },
    }),
  ]);

  // Create purchase orders
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2024-001',
      supplierId: suppliers[0].id,
      totalAmount: 2250.00,
      status: 'APPROVED',
      createdById: manager.id,
      approvedById: admin.id,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[0].id,
            quantity: 5000,
            unitPrice: 0.45,
            totalPrice: 2250.00,
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2024-002',
      supplierId: suppliers[1].id,
      totalAmount: 5100.00,
      status: 'PENDING',
      createdById: manager.id,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[2].id,
            quantity: 15,
            unitPrice: 340.00,
            totalPrice: 5100.00,
          },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNumber: 'PO-2024-003',
      supplierId: suppliers[2].id,
      totalAmount: 890.00,
      status: 'DRAFT',
      createdById: manager.id,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[3].id,
            quantity: 10,
            unitPrice: 89.00,
            totalPrice: 890.00,
          },
        ],
      },
    },
  });

  // Create employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeCode: 'EMP-001',
        name: 'Alice Johnson',
        email: 'alice@enterprise.com',
        department: 'Engineering',
        designation: 'Senior Developer',
        dateOfJoining: new Date('2022-03-15'),
        salary: 95000,
        phone: '+1-555-1001',
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: 'EMP-002',
        name: 'Bob Martinez',
        email: 'bob@enterprise.com',
        department: 'Engineering',
        designation: 'DevOps Engineer',
        dateOfJoining: new Date('2023-01-10'),
        salary: 88000,
        phone: '+1-555-1002',
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: 'EMP-003',
        name: 'Carol Williams',
        email: 'carol@enterprise.com',
        department: 'HR',
        designation: 'HR Manager',
        dateOfJoining: new Date('2021-06-01'),
        salary: 78000,
        phone: '+1-555-1003',
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: 'EMP-004',
        name: 'David Chen',
        email: 'david@enterprise.com',
        department: 'Operations',
        designation: 'Operations Analyst',
        dateOfJoining: new Date('2023-08-20'),
        salary: 72000,
        phone: '+1-555-1004',
      },
    }),
    prisma.employee.create({
      data: {
        employeeCode: 'EMP-005',
        name: 'Eva Rossi',
        email: 'eva@enterprise.com',
        department: 'Finance',
        designation: 'Financial Analyst',
        dateOfJoining: new Date('2022-11-05'),
        salary: 82000,
        phone: '+1-555-1005',
      },
    }),
  ]);

  // Create leave requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: employees[0].id,
      leaveType: 'CASUAL',
      startDate: new Date('2024-06-10'),
      endDate: new Date('2024-06-12'),
      reason: 'Family event',
      status: 'APPROVED',
      approvedById: admin.id,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employees[1].id,
      leaveType: 'SICK',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-16'),
      reason: 'Medical appointment',
      status: 'PENDING',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employees[3].id,
      leaveType: 'EARNED',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-07-05'),
      reason: 'Vacation',
      status: 'PENDING',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin:    admin@enterprise.com / admin123');
  console.log('   Manager:  manager@enterprise.com / manager123');
  console.log('   Employee: employee@enterprise.com / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

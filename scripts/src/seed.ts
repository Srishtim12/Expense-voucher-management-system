import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  const result = await db.execute(sql`SELECT COUNT(*) as c FROM users`);
  const count = Number((result.rows[0] as { c: string }).c);

  if (count > 0) {
    console.log(`Users already seeded (${count} users). Skipping.`);
    process.exit(0);
  }

  const pw = await bcrypt.hash("password123", 10);

  await db.insert(usersTable).values([
    { email: "employee@abc.com", passwordHash: pw, name: "Alice Johnson", role: "employee", employeeId: "EMP-001", department: "Engineering" },
    { email: "employee2@abc.com", passwordHash: pw, name: "Bob Smith", role: "employee", employeeId: "EMP-002", department: "Marketing" },
    { email: "director@abc.com", passwordHash: pw, name: "Carol Director", role: "director", employeeId: "DIR-001", department: "Management" },
    { email: "accounts@abc.com", passwordHash: pw, name: "Dave Accounts", role: "accounts", employeeId: "ACC-001", department: "Finance" },
  ]);

  console.log("Seeded 4 users successfully.");

  // Seed some demo vouchers for employee
  const [emp] = await db.select().from(usersTable);
  if (emp) {
    const { vouchersTable } = await import("@workspace/db");
    await db.insert(vouchersTable).values([
      {
        voucherNumber: "VCH-202507-10001",
        voucherDate: "2025-07-01",
        expenseDate: "2025-06-28",
        department: "Engineering",
        expenseTitle: "Team Conference Travel",
        expenseCategory: "Travel",
        expenseDescription: "Flight and hotel for tech conference in San Francisco",
        amount: "2500.00",
        employeeName: emp.name,
        employeeId: emp.employeeId,
        employeeUserId: emp.id,
        status: "draft",
      },
      {
        voucherNumber: "VCH-202507-10002",
        voucherDate: "2025-07-05",
        expenseDate: "2025-07-03",
        department: "Engineering",
        expenseTitle: "Office Supplies Q3",
        expenseCategory: "Office Supplies",
        expenseDescription: "Stationery and printer cartridges for team",
        amount: "340.50",
        employeeName: emp.name,
        employeeId: emp.employeeId,
        employeeUserId: emp.id,
        status: "pending_approval",
      },
      {
        voucherNumber: "VCH-202507-10003",
        voucherDate: "2025-07-10",
        expenseDate: "2025-07-09",
        department: "Engineering",
        expenseTitle: "Client Dinner",
        expenseCategory: "Meals",
        expenseDescription: "Business dinner with key client",
        amount: "850.00",
        employeeName: emp.name,
        employeeId: emp.employeeId,
        employeeUserId: emp.id,
        status: "approved",
        approvedByName: "Carol Director",
        approvalDate: new Date("2025-07-11"),
      },
    ]);
    console.log("Seeded 3 vouchers.");
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

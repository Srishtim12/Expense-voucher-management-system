# Expense-voucher-management-system

## Project Overview
This is a Full Stack Expense Voucher Management System developed as an internship assignment. The application allows employees to submit expense vouchers, Directors to approve/reject them, and the Accounts team to process approved vouchers.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Database: PostgreSQL (Drizzle ORM)
- Authentication: Role-based Authentication

## Features
- Employee Login
- Create Expense Voucher
- Edit/Delete Draft Voucher
- Submit Voucher
- Director Approval/Rejection
- Accounts Processing
- Dashboard for each role
- Search and Filter Vouchers

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file using `.env.example`.

## Database

Run database migrations before starting the application.

## Assumptions

- Authentication is role-based.
- Employees can edit only draft vouchers.
- Approved vouchers are processed only by Accounts.

## Live Demo
https://expense-voucher-manager--srishtim1205.replit.app

## Repository

GitHub Repository:
https://github.com/Srishtim12/Expense-voucher-management-system

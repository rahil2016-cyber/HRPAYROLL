# HR Allocate - Multi-Tenant Human Resource & Payroll Management System

Welcome to **HR Allocate**, a modern, multi-tenant Human Resource (HR) and Payroll Management application. The platform provides distinct portals for **Super Admins**, **HR Managers**, **Finance Managers**, and **Employees**, allowing organizations to manage operations, track attendance with GPS-based geofencing, manage leaves, process salaries, and handle expense reimbursements.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 (Vite-powered, Javascript)
- **Routing**: React Router DOM (v6) for seamless client-side page transitions
- **Styling**: Modern, responsive Vanilla CSS with premium themes (gradients, shadows, glassmorphism, and structured card components)
- **State & Auth**: Session state handling storing JWT tokens and user metadata securely in `localStorage`

### Backend
- **Language**: PHP 8
- **Routing**: Custom router in `backend/index.php` matching paths `/api/auth`, `/api/employee`, `/api/hr`, `/api/finance`, and `/api/superadmin`
- **Database**: SQLite database (`backend/database.sqlite`) with PDO connection abstraction
- **Authentication**: JWT-based stateless authentication (`backend/helpers/jwt.php`) with verification middleware per role group

---

## 🗄️ Database Schema & Architecture

The database is built on an SQLite engine. Below are the key tables defined in the schema (`backend/setup.php`):

### 1. Multi-Tenant Infrastructure
- `companies`: Manages tenant accounts, names, system subscription plans, and status.
- `company_settings`: Configurable key-value settings per company.
- `branches`: Physical locations/branches with geographic coordinates (`latitude`, `longitude`) and permissible geofence check-in radii (defaults to `150` meters).
- `departments` & `designations`: Core corporate hierarchies.

### 2. User & Access Control
- `users`: Stores emails, passwords (hashed via `password_hash`), roles (`superadmin`, `hr`, `finance`, `employee`), and profile statuses.
- `roles`, `permissions`, `role_permissions`, `user_permissions`: Granular RBAC (Role-Based Access Control) setup.

### 3. Employee Profiles & Data
- `employees`: Relates a system user to a specific company, branch, department, designation, salary history, and status.
- `employee_documents`: Document storage paths for official files (PAN, Aadhaar, Passport, etc.).
- `employee_family`, `employee_bank`, `employee_emergency`: Personal, bank account, and emergency contact details.

### 4. Time & Attendance
- `attendance`: Daily clock-in/clock-out logs containing check-in time, check-out time, coordinate pairs, overtime calculations, and work-from-home (`is_wfh`) markers.
- `attendance_logs`: Immutable transactional logs tracking individual clock-in and clock-out operations, timestamped with browser agent headers.
- `attendance_regularization`: Workflow requests for correcting faulty or missed check-ins.

### 5. Leave Management
- `leave_types`: Configures annual leave types (Casual, Sick, Earned, Comp-off) and default day allocations.
- `leave_balances`: Tracks individual employee leave balances (`allocated`, `used`, `pending`).
- `leave_requests`: Stores dates, duration, reasons, and approval workflows.

### 6. Payroll & Financials
- `payroll_cycles`: Manages monthly payroll generation cycles (Draft, Locked, Processing, Paid).
- `payslips`: Employee earnings and deductions records (Basic, HRA, Allowances, PF, ESI, TDS, Net Salary).
- `salary_components`, `salary_templates`, `salary_history`: Templates and variables defining salary calculations.
- `loans`: Tracks company-issued employee loans and monthly EMIs.
- `expenses`: Reimbursement claims for corporate expenses including digital bill attachment paths.

---

## 🔑 Key Roles & Portals

### 1. Portal Selection & Auth Hub
- Allows users to select their specific role portal.
- Provides token-based stateless login.

### 2. Employee Dashboard
- **GPS Check-In**: Geolocation-aware clock-in and clock-out with immediate visual distance calculation to the company branch.
- **Leave Balances**: Interactive tracker of allocated vs. consumed leaves, plus request submission.
- **My Payslips**: List of generated monthly salary slips with gross-to-net salary breakdown.
- **Expense Reimbursement**: Form to submit reimbursement requests with category and bill attachment options.
- **My Profile**: Access to emergency contact information and bank details.

### 3. HR Manager Dashboard
- **Organization Analytics**: Counts of active employees, present staff today, and pending leaves.
- **Onboarding System**: Onboards new employees, generates credential profiles, and automatically provisions default leave balances from preset templates.
- **Leave Approval Hub**: Central system to approve or reject pending leave requests (deducting days or restoring pending balances safely via SQLite transactions).

### 4. Finance Manager Dashboard
- **Financial Analytics**: Total active payroll budget cost, last payroll cost, and pending expenses count.
- **Payroll Cycles**: Generates monthly drafts, locks cycles, and distributes payslips.
- **Automatic Payroll Processing**: Deducting engine that calculates:
  - **Basic Pay**: 50% of monthly gross salary
  - **HRA**: 25% of monthly gross salary
  - **Special Allowances**: 25% of monthly gross salary
  - **PF Deduction**: 12% on Basic Pay
  - **ESI Deduction**: 0.75% of gross if monthly gross is less than 21,000
  - **TDS Deduction**: 5% of gross if monthly gross is above 50,000
- **Expense Approval**: View and approve/reject employee expense reimbursement claims.

### 5. Super Admin Dashboard
- Centralized multi-tenant management screen to configure system plans, active companies, and overall site settings.

---

## 🛠️ Domain Logic & Core Algorithms

### 📍 GPS Geofencing (Haversine Formula)
To guarantee employees are checking in from the physical office, the backend checks latitude/longitude coordinates against the branch location coordinates using the Haversine formula:
```php
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000; // in meters
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $earthRadius * $c;
}
```
If the distance exceeds the branch `radius_meters`, the backend blocks the clock-in.

### 📅 Leaves Database Integrity
Leave applications check balances transactions dynamically:
1. Calculates duration (`$start->diff($end)->days + 1`).
2. Checks remaining available balance: `(allocated - used - pending)`.
3. Stores request and increments the `pending` balance.
4. On approval, converts `pending` count into `used` count; on rejection, reverts `pending` count.

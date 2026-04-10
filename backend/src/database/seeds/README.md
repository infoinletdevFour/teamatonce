# Team@Once Database Seeding

This directory contains scripts to seed the Team@Once database with sample data for development and testing purposes.

## 🌱 What Gets Seeded

The comprehensive seed script (`seed.ts`) populates your database with:

### 1. **Users** (11 total)
- **1 Admin**: `admin@teamatonce.com`
- **3 Clients**: Business owners who post projects
  - `client@teamatonce.com` - Tech Startup Inc
  - `client2@teamatonce.com` - E-Commerce Pro
  - `client3@teamatonce.com` - FinTech Solutions
- **5 Developers**: Available for project assignments
  - `developer@teamatonce.com` - Alex Developer (React, Node.js)
  - `dev2@teamatonce.com` - Emma Frontend (React, TypeScript)
  - `dev3@teamatonce.com` - James Backend (Node.js, PostgreSQL)
  - `dev4@teamatonce.com` - Sophie Fullstack (React, Node.js, PostgreSQL)
  - `dev5@teamatonce.com` - David Mobile (React Native, Flutter)

**Password for all users**: `Password123!`

### 2. **Companies** (3 total)
- **Tech Startup Inc** - Technology startup building web applications
- **E-Commerce Pro** - E-commerce platform provider
- **FinTech Solutions** - Financial technology solutions company

### 3. **Company Members**
- Each company has its owner as a member
- First company has 3 additional developers as team members

### 4. **Projects** (4 total)
- **E-Commerce Platform Redesign** - $50,000, 3-6 months
- **Mobile Banking Application** - $75,000, 6-12 months
- **CRM System Development** - $40,000, 3-6 months
- **Inventory Management System** - $35,000, 2-4 months

### 5. **Team Assignments**
- 4 developers assigned to the first project with different roles
- Includes hourly rates and allocation percentages

### 6. **Invitations** (3 pending)
- Sample pending invitations to join the first company
- Different roles: Developer, Designer

## 🚀 Running the Seeds

### Option 1: Quick Run (Recommended for Development)
```bash
npm run seed:all
```

This command uses `ts-node` to run the TypeScript seed file directly.

### Option 2: Production-Like Run
```bash
npm run seed:dev
```

This command first builds the project, then runs the compiled JavaScript seed file.

### Option 3: Manual Run
```bash
ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
```

## 📋 Output Example

When you run the seed script, you'll see output like this:

```
🌱 Starting Team@Once database seeding...

👤 Seeding users...
  ✓ Admin user created
  ✓ Client user created: client@teamatonce.com
  ✓ Client user created: client2@teamatonce.com
  ✓ Client user created: client3@teamatonce.com
  ✓ Developer user created: developer@teamatonce.com
  ✓ Developer user created: dev2@teamatonce.com
  ✓ Developer user created: dev3@teamatonce.com
  ✓ Developer user created: dev4@teamatonce.com
  ✓ Developer user created: dev5@teamatonce.com
✅ Created 11 users

🏢 Seeding companies...
  ✓ Company created: Tech Startup Inc
  ✓ Company created: E-Commerce Pro
  ✓ Company created: FinTech Solutions
✅ Created 3 companies

👥 Seeding company members...
  ✓ Added owner to company: Tech Startup Inc
  ✓ Added owner to company: E-Commerce Pro
  ✓ Added owner to company: FinTech Solutions
  ✓ Added developer to Tech Startup Inc
  ✓ Added developer to Tech Startup Inc
  ✓ Added developer to Tech Startup Inc
✅ Added 6 company members

📋 Seeding projects...
  ✓ Project created: E-Commerce Platform Redesign
  ✓ Project created: Mobile Banking Application
  ✓ Project created: CRM System Development
  ✓ Project created: Inventory Management System
✅ Created 4 projects

🤝 Seeding team assignments...
  ✓ Assigned developer to project: developer@teamatonce.com
  ✓ Assigned developer to project: dev2@teamatonce.com
  ✓ Assigned developer to project: dev3@teamatonce.com
  ✓ Assigned developer to project: dev4@teamatonce.com
✅ Created 4 team assignments

📧 Seeding invitations...
  ✓ Invitation created for: newdev1@example.com
  ✓ Invitation created for: newdev2@example.com
  ✓ Invitation created for: designer1@example.com
✅ Created 3 invitations

🎉 Database seeding completed successfully!

📊 Summary:
   - Users: 11
   - Companies: 3
   - Company Members: 6
   - Projects: 4
   - Team Assignments: 4
   - Invitations: 3

✨ You can now login with these credentials:
   Client: client@teamatonce.com / Password123!
   Developer: developer@teamatonce.com / Password123!
   Admin: admin@teamatonce.com / Password123!
```

## 🧪 Testing Endpoints

After seeding, you can test various endpoints:

### 1. Authentication
```bash
# Login as client
POST /api/auth/login
{
  "email": "client@teamatonce.com",
  "password": "Password123!"
}
```

### 2. Companies
```bash
# Get all companies (requires auth)
GET /api/companies

# Get company details
GET /api/companies/{companyId}
```

### 3. Projects
```bash
# Get all projects for a company
GET /api/projects?companyId={companyId}

# Get project details
GET /api/projects/{projectId}
```

### 4. Team Members
```bash
# Get team members for a project
GET /api/team/projects/{projectId}/members
```

### 5. Invitations
```bash
# Get company invitations
GET /api/companies/{companyId}/invitations

# Accept invitation (public endpoint)
POST /api/invitations/{token}/accept
```

## 🔄 Re-running Seeds

If you need to re-run the seeds:

1. **The script is idempotent** - it will skip users/companies that already exist
2. You may see warnings like `⚠ User already exists` - this is normal
3. To start completely fresh, you need to clear your database first

## ⚠️ Important Notes

1. **Development Only**: This seed data is for development and testing only
2. **Passwords**: All users use the same password (`Password123!`) for easy testing
3. **Email Verification**: Seeded users are not email-verified by default
4. **Production**: Never run seeds in production!
5. **Database State**: The script handles existing data gracefully

## 🛠️ Customizing Seeds

To customize the seed data:

1. Open `src/database/seeds/seed.ts`
2. Modify the data arrays in the seed functions:
   - `seedUsers()` - User data
   - `seedCompanies()` - Company data
   - `seedProjects()` - Project data
   - etc.
3. Run the seed script again

## 📚 Related Scripts

- `npm run migrate` - Run database migrations
- `npm run migrate:dev` - Run migrations in dev mode
- `npm run seed:admin` - Seed only admin user
- `npm run seed:courses` - Seed course data
- `npm run seed:clear` - Clear seed data

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
# Install dependencies
npm install
```

### Error: "Database connection failed"
```bash
# Check your .env file has correct database credentials
# Make sure your database is running
```

### Error: "User already exists"
This is normal - the script skips existing records. If you want fresh data:
1. Drop and recreate your database
2. Run migrations: `npm run migrate:dev`
3. Run seeds: `npm run seed:all`

## 📖 Documentation

For more information about the Team@Once platform:
- See `/backend/CLAUDE.md` for development guidelines
- See `/backend/README.md` for general setup
- Check individual module READMEs for specific features

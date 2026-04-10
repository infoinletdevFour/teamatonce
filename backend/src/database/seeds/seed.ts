/**
 * Master Seed Script for Team@Once
 * Seeds the database with sample data for development and testing
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuthService } from '../../modules/auth/auth.service';
import { CompanyService } from '../../modules/company/company.service';
import { InvitationService } from '../../modules/company/invitation.service';
import { ProjectService } from '../../modules/teamatonce/project/project.service';
import { DatabaseService } from '../database/database.service';

async function bootstrap() {
  console.log('🌱 Starting Team@Once database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const companyService = app.get(CompanyService);
  const invitationService = app.get(InvitationService);
  const projectService = app.get(ProjectService);
  const db = app.get(DatabaseService);

  try {
    // 1. Seed Users (Clients, Developers, Admins)
    console.log('👤 Seeding users...');
    const users = await seedUsers(authService);
    console.log(`✅ Created ${users.all.length} users\n`);

    // 2. Seed Companies
    console.log('🏢 Seeding companies...');
    const companies = await seedCompanies(companyService, users.clients);
    console.log(`✅ Created ${companies.length} companies\n`);

    // 3. Seed Projects
    console.log('📋 Seeding projects...');
    const projects = await seedProjects(projectService, users.clients);
    console.log(`✅ Created ${projects.length} projects\n`);

    // 4. Seed Invitations
    console.log('📧 Seeding invitations...');
    const invitations = await seedInvitations(invitationService, companies, users.clients);
    console.log(`✅ Created ${invitations.length} invitations\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.all.length}`);
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Invitations: ${invitations.length}`);
    console.log('\n✨ You can now login with these credentials:');
    console.log('   Client: client@teamatonce.com / Password123!');
    console.log('   Developer: developer@teamatonce.com / Password123!');
    console.log('   Admin: admin@teamatonce.com / Password123!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

async function seedUsers(authService: AuthService) {
  const users = {
    all: [],
    clients: [],
    developers: [],
    admins: [],
  };

  // Create Admin User
  try {
    const admin = await authService.register({
      email: 'admin@teamatonce.com',
      password: 'Password123!',
      name: 'Admin User',
      role: 'admin',
    });
    users.all.push(admin.user);
    users.admins.push(admin.user);
    console.log('  ✓ Admin user created');
  } catch (error) {
    console.log('  ⚠ Admin user already exists');
  }

  // Create Client Users
  const clients = [
    { email: 'client@teamatonce.com', name: 'John Smith' },
    { email: 'client2@teamatonce.com', name: 'Sarah Johnson' },
    { email: 'client3@teamatonce.com', name: 'Michael Brown' },
  ];

  for (const clientData of clients) {
    try {
      const client = await authService.register({
        email: clientData.email,
        password: 'Password123!',
        name: clientData.name,
        role: 'client',
      });
      users.all.push(client.user);
      users.clients.push(client.user);
      console.log(`  ✓ Client user created: ${clientData.email}`);
    } catch (error) {
      console.log(`  ⚠ Client ${clientData.email} already exists`);
    }
  }

  // Create Developer Users
  const developers = [
    { email: 'developer@teamatonce.com', name: 'Alex Developer' },
    { email: 'dev2@teamatonce.com', name: 'Emma Frontend' },
    { email: 'dev3@teamatonce.com', name: 'James Backend' },
    { email: 'dev4@teamatonce.com', name: 'Sophie Fullstack' },
    { email: 'dev5@teamatonce.com', name: 'David Mobile' },
  ];

  for (const devData of developers) {
    try {
      const developer = await authService.register({
        email: devData.email,
        password: 'Password123!',
        name: devData.name,
        role: 'developer',
      });
      users.all.push(developer.user);
      users.developers.push(developer.user);
      console.log(`  ✓ Developer user created: ${devData.email}`);
    } catch (error) {
      console.log(`  ⚠ Developer ${devData.email} already exists`);
    }
  }

  return users;
}

async function seedCompanies(companyService: CompanyService, clients: any[]) {
  const companies = [];

  const companiesData = [
    {
      name: 'Tech Startup Inc',
      displayName: 'Tech Startup',
      description: 'Innovative technology startup building next-generation web applications',
      industry: 'Technology',
      size: '10-50',
      website: 'https://techstartup.example.com',
      email: 'contact@techstartup.example.com',
      phone: '+1-555-0100',
    },
    {
      name: 'E-Commerce Pro',
      displayName: 'E-Commerce Pro',
      description: 'Leading e-commerce platform for modern retail businesses',
      industry: 'E-Commerce',
      size: '50-200',
      website: 'https://ecommercepro.example.com',
      email: 'contact@ecommercepro.example.com',
      phone: '+1-555-0200',
    },
    {
      name: 'FinTech Solutions',
      displayName: 'FinTech Solutions',
      description: 'Financial technology solutions for modern banking',
      industry: 'Finance',
      size: '200-500',
      website: 'https://fintechsolutions.example.com',
      email: 'contact@fintechsolutions.example.com',
      phone: '+1-555-0300',
    },
  ];

  for (let i = 0; i < companiesData.length && i < clients.length; i++) {
    try {
      const company = await companyService.createCompany(clients[i].id, companiesData[i]);
      companies.push(company);
      console.log(`  ✓ Company created: ${companiesData[i].name}`);
    } catch (error) {
      console.log(`  ⚠ Company ${companiesData[i].name} creation failed:`, error.message);
    }
  }

  return companies;
}

async function seedProjects(projectService: ProjectService, clients: any[]) {
  const projects = [];

  const projectTemplates = [
    {
      name: 'E-Commerce Platform Redesign',
      description: 'Complete redesign and modernization of existing e-commerce platform',
      projectType: 'web_app',
      estimatedCost: 50000,
      currency: 'USD',
      estimatedDurationDays: 120,
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      frameworks: ['Next.js', 'NestJS', 'Prisma'],
      features: ['User Authentication', 'Product Catalog', 'Shopping Cart', 'Payment Integration'],
    },
    {
      name: 'Mobile Banking Application',
      description: 'Native mobile application for personal and business banking',
      projectType: 'mobile_app',
      estimatedCost: 75000,
      currency: 'USD',
      estimatedDurationDays: 240,
      techStack: ['React Native', 'Node.js', 'MongoDB'],
      frameworks: ['Expo', 'Express', 'Mongoose'],
      features: ['Account Management', 'Transfers', 'Bill Payments', 'Security Features'],
    },
    {
      name: 'CRM System Development',
      description: 'Custom CRM system for managing customer relationships and sales pipeline',
      projectType: 'web_app',
      estimatedCost: 40000,
      currency: 'USD',
      estimatedDurationDays: 90,
      techStack: ['Vue.js', 'Node.js', 'PostgreSQL'],
      frameworks: ['Nuxt.js', 'NestJS', 'TypeORM'],
      features: ['Contact Management', 'Sales Pipeline', 'Reporting', 'Email Integration'],
    },
  ];

  for (let i = 0; i < Math.min(projectTemplates.length, clients.length); i++) {
    const template = projectTemplates[i];
    const client = clients[i];

    try {
      const project = await projectService.createProject(client.id, template);
      projects.push(project);
      console.log(`  ✓ Project created: ${template.name}`);
    } catch (error) {
      console.log(`  ⚠ Project ${template.name} creation failed:`, error.message);
    }
  }

  return projects;
}

async function seedInvitations(invitationService: InvitationService, companies: any[], clients: any[]) {
  const invitations = [];

  if (companies.length === 0 || clients.length === 0) {
    console.log('  ⚠ No companies available for invitations');
    return invitations;
  }

  const invitationsData = [
    {
      email: 'newdev1@example.com',
      name: 'New Developer One',
      role: 'developer' as any, // TeamMemberRole.DEVELOPER
      message: 'Welcome to our development team!',
    },
    {
      email: 'newdev2@example.com',
      name: 'New Developer Two',
      role: 'developer' as any, // TeamMemberRole.DEVELOPER
      message: 'Excited to have you join our team!',
    },
    {
      email: 'designer1@example.com',
      name: 'UI Designer',
      role: 'designer' as any, // TeamMemberRole.DESIGNER
      message: 'Looking forward to working with you!',
    },
  ];

  const company = companies[0];
  const client = clients[0];

  for (const invData of invitationsData) {
    try {
      const invitation = await invitationService.createInvitation(
        company.id,
        client.id,
        invData
      );
      invitations.push(invitation);
      console.log(`  ✓ Invitation created for: ${invData.email}`);
    } catch (error) {
      console.log(`  ⚠ Invitation ${invData.email} creation failed:`, error.message);
    }
  }

  return invitations;
}

// Run the seeder
bootstrap()
  .then(() => {
    console.log('\n✅ Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });

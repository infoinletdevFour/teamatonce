import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private get ADMIN_EMAIL(): string {
    return this.configService.get<string>('ADMIN_EMAIL', 'admin@gmail.com');
  }

  private get ADMIN_PASSWORD(): string {
    return this.configService.get<string>('ADMIN_PASSWORD', 'admin123');
  }

  private get ADMIN_NAME(): string {
    return this.configService.get<string>('ADMIN_NAME', 'System Admin');
  }

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      this.logger.log('Checking for admin user...');

      // Try to find existing admin user
      const existingUsers = await this.db.listUsers({ limit: 1000 });
      const existingAdmin = existingUsers.users?.find(
        (u: any) => u.email === this.ADMIN_EMAIL
      );

      if (existingAdmin) {
        // Check if user already has admin role
        const currentRole = existingAdmin.metadata?.role;

        if (currentRole === 'admin' || currentRole === 'super_admin') {
          this.logger.log(`Admin user already exists: ${this.ADMIN_EMAIL}`);
          return;
        }

        // Update to admin role
        this.logger.log('Updating existing user to admin role...');
        await this.db.updateUser(existingAdmin.id, {
          metadata: {
            ...existingAdmin.metadata,
            role: 'admin',
            name: this.ADMIN_NAME,
            approval_status: 'approved',
          },
        });
        this.logger.log(`Admin role assigned to: ${this.ADMIN_EMAIL}`);
      } else {
        // Create new admin user
        this.logger.log('Creating admin user...');

        try {
          const result = await /* TODO: use AuthService */ this.db.signUp(
            this.ADMIN_EMAIL,
            this.ADMIN_PASSWORD,
            this.ADMIN_NAME,
            {
              role: 'admin',
              name: this.ADMIN_NAME,
              approval_status: 'approved',
            }
          );

          if (result.user) {
            this.logger.log(`Admin user created: ${this.ADMIN_EMAIL}`);
          }
        } catch (signUpError: any) {
          // User might already exist but wasn't found in list
          if (signUpError.message?.includes('already exists') || signUpError.message?.includes('already registered')) {
            this.logger.warn('Admin user already exists (signup failed). Skipping...');
          } else {
            throw signUpError;
          }
        }
      }

      this.logger.log('=================================');
      this.logger.log('Admin user setup complete.');
      this.logger.log(`  Email: ${this.ADMIN_EMAIL}`);
      this.logger.log(`  Password: ${this.ADMIN_PASSWORD}`);
      this.logger.log('=================================');
    } catch (error: any) {
      this.logger.error(`Failed to seed admin user: ${error.message}`);
      // Don't throw - allow app to continue even if admin seeding fails
    }
  }
}

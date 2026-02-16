import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseService } from '../services/supabase.service';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [SupabaseService],
  exports: [ConfigModule, AuthModule, SupabaseService],
})
export class SharedModule {}
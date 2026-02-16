import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

export interface SupabaseAuthResponse {
  user: any;
  session: any;
  error: any;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = 'https://kbqfhsvpeiwomuoappep.supabase.co';
    const supabaseKey = 'sb_publishable_CqL-rXpQeKEhv4kOp-Fuew_qGwfcwHp';
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
    
    this.logger.log('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async signUp(email: string, password: string, userData?: any): Promise<SupabaseAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });
      
      if (error) {
        this.logger.error(`Sign up error: ${error.message}`);
        return { user: null, session: null, error };
      }
      
      this.logger.log(`User signed up: ${email}`);
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      this.logger.error('Sign up exception:', error);
      return { user: null, session: null, error };
    }
  }

  async signIn(email: string, password: string): Promise<SupabaseAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        this.logger.error(`Sign in error: ${error.message}`);
        return { user: null, session: null, error };
      }
      
      this.logger.log(`User signed in: ${email}`);
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      this.logger.error('Sign in exception:', error);
      return { user: null, session: null, error };
    }
  }

  async signOut(accessToken: string): Promise<{ error: any }> {
    try {
      // Set the auth session first
      await this.supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
      
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        this.logger.error(`Sign out error: ${error.message}`);
        return { error };
      }
      
      this.logger.log('User signed out');
      return { error: null };
    } catch (error) {
      this.logger.error('Sign out exception:', error);
      return { error };
    }
  }

  async getUser(accessToken: string): Promise<{ user: any; error: any }> {
    try {
      // Set the auth session to get the user
      await this.supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
      
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        this.logger.error(`Get user error: ${error.message}`);
        return { user: null, error };
      }
      
      return { user, error: null };
    } catch (error) {
      this.logger.error('Get user exception:', error);
      return { user: null, error };
    }
  }

  async updateUserData(accessToken: string, userData: any): Promise<{ user: any; error: any }> {
    try {
      // Set the auth session first
      await this.supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
      
      const { data, error } = await this.supabase.auth.updateUser({
        data: userData
      });
      
      if (error) {
        this.logger.error(`Update user data error: ${error.message}`);
        return { user: null, error };
      }
      
      this.logger.log('User data updated');
      return { user: data.user, error: null };
    } catch (error) {
      this.logger.error('Update user data exception:', error);
      return { user: null, error };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ session: any; error: any }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });
      
      if (error) {
        this.logger.error(`Refresh token error: ${error.message}`);
        return { session: null, error };
      }
      
      return { session: data.session, error: null };
    } catch (error) {
      this.logger.error('Refresh token exception:', error);
      return { session: null, error };
    }
  }

  // Admin operations (requires service role key)
  async adminGetUser(userId: string): Promise<{ user: any; error: any }> {
    try {
      // This requires a service role key, not the public key
      // Implementation would be similar to getUser but with service role client
      const serviceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceRoleKey) {
        return { user: null, error: { message: 'Service role key not configured' } };
      }
      
      // Would need to create a service role client here
      return { user: null, error: { message: 'Admin operations not implemented yet' } };
    } catch (error) {
      this.logger.error('Admin get user exception:', error);
      return { user: null, error };
    }
  }
}
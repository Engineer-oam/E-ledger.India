import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { SupabaseService } from '../services/supabase.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: any) {
    const { email, password, userData } = signUpDto;
    
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const response = await this.supabaseService.signUp(email, password, userData);
    
    if (response.error) {
      this.logger.error(`Sign up failed for ${email}: ${response.error.message}`);
      throw new BadRequestException(`Sign up failed: ${response.error.message}`);
    }

    this.logger.log(`User signed up successfully: ${email}`);
    
    return {
      success: true,
      message: 'User created successfully',
      user: response.user,
      session: response.session,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any) {
    const { email, password } = loginDto;
    
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const response = await this.supabaseService.signIn(email, password);
    
    if (response.error) {
      this.logger.error(`Login failed for ${email}: ${response.error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in successfully: ${email}`);
    
    return {
      success: true,
      message: 'Login successful',
      user: response.user,
      session: response.session,
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: any) {
    const { accessToken } = logoutDto;
    
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    const response = await this.supabaseService.signOut(accessToken);
    
    if (response.error) {
      this.logger.error(`Logout failed: ${response.error.message}`);
      // Still return success as client should clear token anyway
    }

    this.logger.log('User logged out successfully');
    
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: any) {
    const { refreshToken } = refreshDto;
    
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const response = await this.supabaseService.refreshToken(refreshToken);
    
    if (response.error) {
      this.logger.error(`Token refresh failed: ${response.error.message}`);
      throw new BadRequestException(`Token refresh failed: ${response.error.message}`);
    }

    this.logger.log('Token refreshed successfully');
    
    return {
      success: true,
      message: 'Token refreshed successfully',
      session: response.session,
    };
  }
}
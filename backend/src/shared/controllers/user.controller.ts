import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../shared/guards/supabase-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { PerformanceInterceptor } from '../../shared/interceptors/performance.interceptor';
import { User } from '../../shared/schemas/user.schema';
import { UserService } from '../services/user.service';
import { SupabaseService } from '../services/supabase.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(LoggingInterceptor, PerformanceInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new user with Supabase auth' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: any) {
    const { email, password, name, gln, orgName, sector, role, positionLabel, erpType, phone, address } = signUpDto;
    
    // Validate required fields
    if (!email || !password || !name || !gln || !orgName || !sector || !role || !positionLabel || !erpType) {
      throw new BadRequestException('Missing required fields');
    }

    // Check if user already exists in MongoDB
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Supabase
    const supabaseResponse = await this.supabaseService.signUp(email, password, {
      name,
      gln,
      orgName,
      sector,
      role,
      positionLabel,
      erpType,
      phone,
      address,
      country: 'IN', // Default to India
      erpStatus: 'PENDING',
      isEmailVerified: false,
    });

    if (supabaseResponse.error) {
      if (supabaseResponse.error.message.includes('already registered')) {
        throw new ConflictException('User with this email already exists in authentication system');
      }
      throw new BadRequestException(`Authentication error: ${supabaseResponse.error.message}`);
    }

    // Create user in MongoDB
    const mongoUser = await this.userService.create({
      ...signUpDto,
      email,
      name,
      gln,
      orgName,
      sector,
      role,
      positionLabel,
      erpType,
      phone,
      address,
      country: 'IN',
      erpStatus: 'PENDING',
      isEmailVerified: false,
      supabaseId: supabaseResponse.user.id,
    });

    return {
      success: true,
      message: 'User created successfully',
      user: {
        id: mongoUser._id,
        email: mongoUser.email,
        name: mongoUser.name,
        gln: mongoUser.gln,
        orgName: mongoUser.orgName,
        sector: mongoUser.sector,
        role: mongoUser.role,
      },
      session: supabaseResponse.session,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login with Supabase auth' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any) {
    const { email, password } = loginDto;
    
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Authenticate with Supabase
    const supabaseResponse = await this.supabaseService.signIn(email, password);
    
    if (supabaseResponse.error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user from MongoDB
    const mongoUser = await this.userService.findByEmail(email);
    if (!mongoUser) {
      throw new UnauthorizedException('User not found in system');
    }

    // Update last login
    await this.userService.update(mongoUser._id.toString(), { lastLoginAt: new Date() });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: mongoUser._id,
        email: mongoUser.email,
        name: mongoUser.name,
        gln: mongoUser.gln,
        orgName: mongoUser.orgName,
        sector: mongoUser.sector,
        role: mongoUser.role,
        erpStatus: mongoUser.erpStatus,
      },
      session: supabaseResponse.session,
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: any) {
    const { accessToken } = logoutDto;
    
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    const response = await this.supabaseService.signOut(accessToken);
    
    if (response.error) {
      // Even if Supabase logout fails, we still return success
      // as the client should clear the token anyway
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Body() body: any) {
    const request = body.request; // Get request from context
    const user = request.user;
    
    const mongoUser = await this.userService.findByEmail(user.email);
    if (!mongoUser) {
      throw new UnauthorizedException('User not found');
    }

    // Return sanitized user profile
    const { password, ...profile } = mongoUser.toObject();
    
    return {
      success: true,
      user: {
        ...profile,
        supabaseId: user.userId,
      },
    };
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('REGULATOR', 'AUDITOR')
  @Get()
  @ApiOperation({ summary: 'Get all users (Admin/Regulator only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sector', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sector') sector?: string,
  ) {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sector,
    };
    return this.userService.findAll(options);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    // Remove sensitive fields that shouldn't be updated via this endpoint
    const { password, email, gln, ...updateData } = updateUserDto;
    return this.userService.update(id, updateData);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('REGULATOR', 'AUDITOR')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID (Admin/Regulator only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
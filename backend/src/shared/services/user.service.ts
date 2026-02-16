import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { LoggingService } from './logging.service';
import { MetricsService } from './metrics.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface UserQueryOptions {
  page?: number;
  limit?: number;
  sector?: string;
  role?: string;
  country?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private loggingService: LoggingService,
    private metricsService: MetricsService,
  ) {}

  async create(createUserDto: any): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email: createUserDto.email }, { gln: createUserDto.gln }]
    });
    
    if (existingUser) {
      throw new ConflictException('User with this email or GLN already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create new user
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    
    // Log the event
    this.loggingService.logBusinessEvent('USER_CREATED', savedUser._id?.toString(), {
      email: savedUser.email,
      gln: savedUser.gln,
      orgName: savedUser.orgName,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('POST', '/users', 201);

    return savedUser;
  }

  async findAll(options: UserQueryOptions = {}): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, sector, role, country } = options;
    
    const query: any = { isActive: true };
    
    if (sector) query.sector = sector;
    if (role) query.role = role;
    if (country) query.country = country;

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    // Log the event
    this.loggingService.logBusinessEvent('USERS_FETCHED', undefined, {
      page,
      limit,
      sector,
      role,
      country,
      total,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('GET', '/users', 200);

    return { users, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Log the event
    this.loggingService.logBusinessEvent('USER_FETCHED', id, {
      email: user.email,
      gln: user.gln,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('GET', `/users/${id}`, 200);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByGln(gln: string): Promise<User | null> {
    return this.userModel.findOne({ gln }).exec();
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    // Don't update password here - that should be a separate method
    const updateData: any = { ...updateUserDto };
    delete updateData.password;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Log the event
    this.loggingService.logBusinessEvent('USER_UPDATED', id, {
      email: updatedUser.email,
      gln: updatedUser.gln,
      changes: Object.keys(updateUserDto),
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('PUT', `/users/${id}`, 200);

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const deletedUser = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false, status: 'DELETED' },
      { new: true },
    ).exec();

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Log the event
    this.loggingService.logBusinessEvent('USER_DELETED', id, {
      email: deletedUser.email,
      gln: deletedUser.gln,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('DELETE', `/users/${id}`, 200);
  }

  async login(credentials: { email: string; password: string }): Promise<{ accessToken: string; user: User }> {
    const { email, password } = credentials;
    
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user._id,
      email: user.email,
      gln: user.gln,
      orgName: user.orgName,
      role: user.role,
      sector: user.sector,
    };
    
    const secret = process.env.JWT_SECRET || 'default_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '60m';
    
    const accessToken = jwt.sign(payload, secret, { expiresIn });

    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, { 
      lastLoginAt: new Date() 
    }).exec();

    // Log the event
    this.loggingService.logBusinessEvent('USER_LOGIN', user._id?.toString(), {
      email: user.email,
      gln: user.gln,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('POST', '/users/login', 200);

    return { accessToken, user };
  }

  async logout(logoutData: any): Promise<void> {
    // In a real implementation, you might want to invalidate the token
    // For now, we'll just log the event
    
    this.loggingService.logBusinessEvent('USER_LOGOUT', logoutData.userId, {
      userId: logoutData.userId,
      timestamp: new Date().toISOString(),
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('POST', '/users/logout', 200);
  }

  async getProfile(id: string): Promise<User> {
    const user = await this.findById(id);
    
    // Return a sanitized version of the user profile
    const { password, ...profile } = user.toObject();
    return profile as User;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userModel.findByIdAndUpdate(userId, { 
      password: hashedNewPassword 
    }).exec();

    // Log the event
    this.loggingService.logBusinessEvent('PASSWORD_CHANGED', userId, {
      email: user.email,
      gln: user.gln,
    });
    
    // Increment metric
    this.metricsService.incrementHttpRequest('PUT', `/users/${userId}/password`, 200);
  }
}
# Supabase Authentication Integration

## Overview
This document explains how Supabase authentication has been integrated into the e-ledger system.

## Configuration
The system is configured with the following Supabase credentials:
- **Project URL**: https://kbqfhsvpeiwomuoappep.supabase.co
- **Publishable API Key**: sb_publishable_CqL-rXpQeKEhv4kOp-Fuew_qGwfcwHp

These credentials are configured in the `.env` file and directly in the `supabase.service.ts` file.

## Key Components

### 1. Supabase Service (`supabase.service.ts`)
- Handles all Supabase authentication operations
- Provides methods for sign up, sign in, sign out, and user management
- Integrates with Supabase JavaScript client

### 2. Supabase Auth Guard (`supabase-auth.guard.ts`)
- Protects routes that require authentication
- Validates JWT tokens from Supabase
- Extracts user information and adds it to the request object

### 3. Auth Controller (`auth.controller.ts`)
- Provides REST endpoints for authentication
- Handles sign up, login, logout, and token refresh
- Returns proper HTTP responses and error handling

### 4. Updated User Controller
- Modified to work with Supabase authentication
- Separates authentication logic from user management
- Maintains compatibility with existing MongoDB user data

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### User Management Endpoints
- `POST /api/users/signup` - Complete user registration (with profile data)
- `POST /api/users/login` - User login with profile data
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

## Security Features

1. **JWT Token Validation**: Uses Supabase's built-in JWT validation
2. **Role-based Access Control**: Supports role-based permissions
3. **Secure Token Handling**: Proper token management and refresh
4. **Session Management**: Integrated session handling with Supabase

## Migration Notes

The system maintains backward compatibility by:
- Keeping existing MongoDB user data structure
- Adding `supabaseId` field to link MongoDB users with Supabase users
- Preserving existing API contracts where possible
- Gradually migrating authentication to Supabase

## Future Enhancements

1. **Email Verification**: Implement email verification flows
2. **Password Reset**: Add password reset functionality
3. **Multi-factor Authentication**: Implement MFA support
4. **Social Login**: Add Google/Facebook login options
5. **Admin Panel**: Create admin interface for user management

## Testing

To test the authentication:
1. Use the `/api/auth/signup` endpoint to create a new user
2. Use the `/api/auth/login` endpoint to authenticate
3. Use the returned access token in the `Authorization: Bearer <token>` header
4. Access protected endpoints with the valid token

## Error Handling

The system provides comprehensive error handling:
- Proper HTTP status codes
- Detailed error messages
- Logging of authentication events
- Graceful handling of token expiration
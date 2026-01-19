use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{Utc, Duration};
use argon2::{Argon2, PasswordHash, PasswordVerifier, PasswordHasher, SaltString};
use rand::rngs::OsRng;

// Role-based access control constants
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Role {
    Admin,
    Manager,
    Employee,
    Supplier,
    Distributor,
    Retailer,
}

impl ToString for Role {
    fn to_string(&self) -> String {
        match self {
            Role::Admin => "ADMIN".to_string(),
            Role::Manager => "MANAGER".to_string(),
            Role::Employee => "EMPLOYEE".to_string(),
            Role::Supplier => "SUPPLIER".to_string(),
            Role::Distributor => "DISTRIBUTOR".to_string(),
            Role::Retailer => "RETAILER".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub gln: String,
    pub role: Role,
    pub org_name: String,
    pub country: String,
    pub sector: String,
    pub password_hash: String,
    pub is_active: bool,
    pub is_verified: bool,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
    pub last_login_at: Option<chrono::DateTime<Utc>>,
    pub failed_login_attempts: u32,
    pub locked_until: Option<chrono::DateTime<Utc>>,
    pub permissions: Vec<String>, // Additional permissions beyond role
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub description: String,
}

// Authentication service for handling user authentication and RBAC
pub struct AuthService {
    users: HashMap<String, User>, // email -> User
    gln_index: HashMap<String, String>, // gln -> email (for quick lookup)
}

impl AuthService {
    pub fn new() -> Self {
        AuthService {
            users: HashMap::new(),
            gln_index: HashMap::new(),
        }
    }

    // Create a new user
    pub fn create_user(&mut self, user_data: CreateUserRequest) -> Result<User, String> {
        // Check if user already exists
        if self.users.contains_key(&user_data.email) {
            return Err("User with this email already exists".to_string());
        }

        // Check if GLN is already registered
        if self.gln_index.contains_key(&user_data.gln) {
            return Err("GLN already registered".to_string());
        }

        let now = Utc::now();
        let password_hash = self.hash_password(&user_data.password)?;

        let user = User {
            id: uuid::Uuid::new_v4().to_string(),
            name: user_data.name,
            email: user_data.email,
            gln: user_data.gln,
            role: user_data.role,
            org_name: user_data.org_name,
            country: user_data.country,
            sector: user_data.sector,
            password_hash,
            is_active: true,
            is_verified: false, // Should be verified through email verification
            created_at: now,
            updated_at: now,
            last_login_at: None,
            failed_login_attempts: 0,
            locked_until: None,
            permissions: user_data.permissions.unwrap_or_default(),
        };

        self.users.insert(user.email.clone(), user.clone());
        self.gln_index.insert(user.gln.clone(), user.email.clone());

        Ok(user)
    }

    // Authenticate a user
    pub fn authenticate(&mut self, email: &str, password: &str) -> Result<User, String> {
        let user = self.users.get(email).ok_or("User not found")?;

        // Check if account is locked
        if let Some(locked_until) = user.locked_until {
            if Utc::now() < locked_until {
                return Err("Account is temporarily locked due to multiple failed login attempts".to_string());
            }
        }

        // Verify password
        if !self.verify_password(&user.password_hash, password)? {
            // Increment failed attempts
            let mut user_clone = user.clone();
            user_clone.failed_login_attempts += 1;

            // Lock account after 5 failed attempts for 30 minutes
            if user_clone.failed_login_attempts >= 5 {
                user_clone.locked_until = Some(Utc::now() + Duration::minutes(30));
            }

            self.users.insert(user.email.clone(), user_clone);
            return Err("Invalid credentials".to_string());
        }

        // Reset failed attempts and update last login
        let mut user_clone = user.clone();
        user_clone.failed_login_attempts = 0;
        user_clone.locked_until = None;
        user_clone.last_login_at = Some(Utc::now());
        user_clone.updated_at = Utc::now();

        self.users.insert(user.email.clone(), user_clone.clone());

        Ok(user_clone)
    }

    // Check if user has specific permission
    pub fn has_permission(&self, email: &str, permission: &str) -> Result<bool, String> {
        let user = self.users.get(email).ok_or("User not found")?;

        // Check role-based permissions
        let role_permissions = self.get_role_permissions(&user.role);
        if role_permissions.contains(&permission.to_string()) {
            return Ok(true);
        }

        // Check additional permissions
        Ok(user.permissions.contains(&permission.to_string()))
    }

    // Get all permissions for a user
    pub fn get_all_permissions(&self, email: &str) -> Result<Vec<String>, String> {
        let user = self.users.get(email).ok_or("User not found")?;
        
        let mut all_permissions = self.get_role_permissions(&user.role);
        all_permissions.extend(user.permissions.clone());
        
        // Remove duplicates
        all_permissions.sort();
        all_permissions.dedup();
        
        Ok(all_permissions)
    }

    // Get permissions based on role
    fn get_role_permissions(&self, role: &Role) -> Vec<String> {
        match role {
            Role::Admin => vec![
                "users:read".to_string(),
                "users:write".to_string(),
                "users:delete".to_string(),
                "blocks:read".to_string(),
                "blocks:write".to_string(),
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "erp:write".to_string(),
                "compliance:read".to_string(),
                "compliance:write".to_string(),
                "settings:read".to_string(),
                "settings:write".to_string(),
            ],
            Role::Manager => vec![
                "users:read".to_string(),
                "users:write".to_string(),
                "blocks:read".to_string(),
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "erp:write".to_string(),
                "compliance:read".to_string(),
            ],
            Role::Employee => vec![
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "compliance:read".to_string(),
            ],
            Role::Supplier => vec![
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "blocks:read".to_string(),
            ],
            Role::Distributor => vec![
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "blocks:read".to_string(),
            ],
            Role::Retailer => vec![
                "transactions:read".to_string(),
                "transactions:write".to_string(),
                "erp:read".to_string(),
                "blocks:read".to_string(),
            ],
        }
    }

    // Update user role
    pub fn update_user_role(&mut self, email: &str, new_role: Role) -> Result<(), String> {
        let mut user = self.users.get_mut(email).ok_or("User not found")?.clone();
        user.role = new_role;
        user.updated_at = Utc::now();
        self.users.insert(email.to_string(), user);
        Ok(())
    }

    // Activate/deactivate user
    pub fn set_user_active(&mut self, email: &str, active: bool) -> Result<(), String> {
        let mut user = self.users.get_mut(email).ok_or("User not found")?.clone();
        user.is_active = active;
        user.updated_at = Utc::now();
        self.users.insert(email.to_string(), user);
        Ok(())
    }

    // Verify password hash
    fn verify_password(&self, hash: &str, password: &str) -> Result<bool, String> {
        let parsed_hash = PasswordHash::new(hash).map_err(|e| e.to_string())?;
        Ok(Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok())
    }

    // Hash password
    fn hash_password(&self, password: &str) -> Result<String, String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        argon2.hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| e.to_string())
    }

    // Get user by email
    pub fn get_user_by_email(&self, email: &str) -> Option<&User> {
        self.users.get(email)
    }

    // Get user by GLN
    pub fn get_user_by_gln(&self, gln: &str) -> Option<&User> {
        if let Some(email) = self.gln_index.get(gln) {
            self.users.get(email)
        } else {
            None
        }
    }
}

// Request structure for creating a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    pub gln: String,
    pub role: Role,
    pub org_name: String,
    pub country: String,
    pub sector: String,
    pub password: String,
    pub permissions: Option<Vec<String>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_auth_service() {
        let mut auth_service = AuthService::new();
        
        // Create a test user
        let user_request = CreateUserRequest {
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            gln: "1234567890123".to_string(),
            role: Role::Manager,
            org_name: "Test Org".to_string(),
            country: "US".to_string(),
            sector: "Pharma".to_string(),
            password: "securepassword123".to_string(),
            permissions: Some(vec!["custom:permission".to_string()]),
        };

        let user = auth_service.create_user(user_request).unwrap();
        assert_eq!(user.name, "Test User");

        // Authenticate the user
        let authenticated_user = auth_service.authenticate("test@example.com", "securepassword123").unwrap();
        assert_eq!(authenticated_user.email, "test@example.com");

        // Test permissions
        let has_perm = auth_service.has_permission("test@example.com", "transactions:read").unwrap();
        assert!(has_perm);

        let has_custom_perm = auth_service.has_permission("test@example.com", "custom:permission").unwrap();
        assert!(has_custom_perm);

        let all_perms = auth_service.get_all_permissions("test@example.com").unwrap();
        assert!(all_perms.contains(&"transactions:read".to_string()));
        assert!(all_perms.contains(&"custom:permission".to_string()));
    }
}
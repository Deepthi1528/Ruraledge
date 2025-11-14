CREATE DATABASE rural360;
USE rural360;
select *from staff;
-- Departments
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    active_status BOOLEAN DEFAULT TRUE
);
SELECT *from users;
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;

SET SQL_SAFE_UPDATES = 0;
UPDATE users SET is_deleted = 1;
SET SQL_SAFE_UPDATES = 1;


INSERT INTO departments (name, active_status) VALUES
('WATER MANAGEMENT', TRUE),
('WASTE COLLECTION', TRUE),
('STREETLIGHT MANAGEMENT', TRUE);

-- Wards
CREATE TABLE wards (
    ward_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100)
);

INSERT INTO wards (name, region) VALUES
('Ward A', 'North Region'),
('Ward B', 'South Region'),
('Ward C', 'East Region');

-- Users
CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    registered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);
select*from users;
UPDATE users
SET password_hash = '$2b$10$bdP5G8RO2PAejNbWKDeJ.OwjKa0O6uLXtubB9mDRcgX5nv80Ib1gq'
WHERE email = 'deepthishalini603@gmail.com';

ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expiry DATETIME;

DESCRIBE users;
SHOW COLUMNS FROM users LIKE 'is_deleted';
-- Staff
CREATE TABLE staff (
    staff_id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT,
    assigned_ward_id INT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    registered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (assigned_ward_id) REFERENCES wards(ward_id)
);
select * from staff;
-- Admins
CREATE TABLE admins (
    admin_id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'superadmin',
    status VARCHAR(20) DEFAULT 'active',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Insert default admin
-- Password hash = bcrypt of "Admin@123"
-- Remove existing admin if needed
DELETE FROM admins WHERE email='admin@rural360.com';

-- Insert a new admin
INSERT INTO admins (admin_id, name, email, password_hash, role, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Super Admin',
  'admin@rural360.com',
  '$2b$10$6UiBIaNM0zq3Q662kVsN8Ov5sYX7Z72luBkcBzud3DlJHcsl1f26e',  -- bcrypt hash of 'Admin@123'
  'superadmin',
  'active'
);
select*from staff;

ALTER TABLE complaints
ADD COLUMN scheduled_visit DATE;
-- Complaints
CREATE TABLE complaints (
    complaint_id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    department_id INT,
    issue_type VARCHAR(100),
    description TEXT,
    location TEXT,
    photo_url VARCHAR(255),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_staff_id CHAR(36),
    status ENUM('pending','in_progress','resolved','rejected') DEFAULT 'pending',
    resolution_notes TEXT,
    resolution_image VARCHAR(255),
    resolved_on TIMESTAMP,
    preferred_contact_method ENUM('Phone', 'Email'),
    occurred_on DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(staff_id)
);
ALTER TABLE complaints
ADD COLUMN email VARCHAR(255) NULL,
ADD COLUMN phone_number VARCHAR(20) NULL;
ALTER TABLE complaints
ADD COLUMN resolved_image VARCHAR(255);
select * from complaints;
DESCRIBE complaints;

-- Complaint status history
CREATE TABLE complaint_status_history (
    history_id CHAR(36) PRIMARY KEY,
    complaint_id CHAR(36),
    status VARCHAR(20),
    updated_by VARCHAR(36),
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
);
ALTER TABLE complaints
DROP COLUMN preferred_contact_method;
ALTER TABLE complaints
ADD COLUMN preferred_contact_method VARCHAR(20) NULL;

-- Feedback
CREATE TABLE feedback (
    feedback_id CHAR(36) PRIMARY KEY,
    complaint_id CHAR(36),
    user_id CHAR(36),
    staff_id CHAR(36),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
);

-- Alerts
CREATE TABLE alerts (
    alert_id CHAR(36) PRIMARY KEY,
    title VARCHAR(100),
    message TEXT,
    type VARCHAR(20),
    target_audience VARCHAR(50),
    created_by_admin_id CHAR(36),
    scheduled_time TIMESTAMP,
    expiry_date TIMESTAMP,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(admin_id)
);

-- Login logs
CREATE TABLE login_logs (
    log_id CHAR(36) PRIMARY KEY,
    user_type ENUM('user','staff','admin') NOT NULL,
    user_id CHAR(36),
    user_name VARCHAR(100),
    ip_address VARCHAR(100),
    device_info TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT admin_id, name, email, password_hash, role, status
FROM admins;


UPDATE admins
SET password_hash = '$2b$10$5afIUSpwTUjBTc3SBxVTqeby8n4XE0zrhGAfsT/3V1mT7lqiql8Lu'
WHERE email = 'admin@rural360.com';
ALTER TABLE complaints
ADD COLUMN email VARCHAR(255) NULL,
ADD COLUMN phone_number VARCHAR(20) NULL;

select*from users;

-- messages table (run once)
CREATE TABLE IF NOT EXISTS messages (
  message_id CHAR(36) PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  complaint_id CHAR(36),
  message TEXT,
  attachment_url VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT staff_id, name, status, department_id FROM staff WHERE name = 'shalini';
SHOW CREATE TABLE complaints;
SHOW COLUMNS FROM complaints LIKE 'status';
ALTER TABLE complaints
MODIFY COLUMN status ENUM('pending','assigned','in_progress','resolved','rejected')
NOT NULL DEFAULT 'pending';
ALTER TABLE complaints ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE complaints ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE staff ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE complaint_status_history
DROP FOREIGN KEY complaint_status_history_ibfk_1;

ALTER TABLE complaint_status_history
ADD CONSTRAINT complaint_status_history_ibfk_1
FOREIGN KEY (complaint_id)
REFERENCES complaints(complaint_id)
ON DELETE CASCADE;



CREATE TABLE chat_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_message TEXT NOT NULL,
    bot_reply TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE chat_logs ADD COLUMN language VARCHAR(10) AFTER bot_reply;
select * from chat_logs;
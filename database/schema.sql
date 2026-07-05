-- =====================================================================
-- Student Opportunity Recommendation Platform
-- Raw SQL schema for MySQL (no ORM, used with mysql2 in Node/Express)
-- Actors: Student, Admin, Organization/University, System (internal)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS is_project
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE is_project;

-- ---------------------------------------------------------------------
-- 1. CORE AUTH TABLE
-- One row per login-capable account: student, admin, or organization.
-- Organization-specific and student-specific details live in their own
-- profile tables below (1-to-1 extension pattern).
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  email               VARCHAR(191) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  role                ENUM('student', 'admin', 'organization') NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token  VARCHAR(255) NULL,
  token_expires_at    TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. STUDENT PROFILE
-- Holds everything the IR engine needs for the non-skill score
-- components: education (15%), location (15%), experience (10%).
-- Location is plain text (e.g. "Nairobi") — matched by exact/partial
-- text comparison against opportunities.location, not haversine.
-- ---------------------------------------------------------------------
CREATE TABLE student_profiles (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL UNIQUE,
  full_name        VARCHAR(150) NOT NULL,
  institution      VARCHAR(150),
  course_of_study  VARCHAR(150),
  education_level  ENUM('certificate','diploma','undergraduate','graduate') NOT NULL,
  experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  location         VARCHAR(150),
  bio              TEXT,
  cv_url           VARCHAR(255),
  cv_filename       VARCHAR(255),
  profile_picture_url VARCHAR(255),
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. TAGS (shared skills + interests master list)
-- One table instead of separate skills/interests tables. `type`
-- distinguishes which score component (skills 50% vs interests 10%)
-- a tag feeds into, while still letting both share one vocabulary.
-- ---------------------------------------------------------------------
CREATE TABLE tags (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('skill', 'interest') NOT NULL,
  UNIQUE KEY uniq_tag (name, type)
) ENGINE=InnoDB;

CREATE TABLE student_tags (
  student_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (student_id, tag_id),
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. ORGANIZATIONS / UNIVERSITIES
-- The new third actor. They log in via `users` (role='organization'),
-- and this table holds their public profile + verification state.
-- Admin approves/rejects new organizations before they can post.
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL UNIQUE,
  name                VARCHAR(150) NOT NULL,
  type                ENUM('company','university','ngo','government') NOT NULL,
  description         TEXT,
  website             VARCHAR(255),
  logo_url            VARCHAR(255),
  location            VARCHAR(150),
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by         INT NULL,              -- admin user_id who verified/rejected
  verified_at         TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. OPPORTUNITIES
-- Now posted by an organization, not a generic admin.
-- ---------------------------------------------------------------------
CREATE TABLE opportunities (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  organization_id   INT NOT NULL,
  title             VARCHAR(200) NOT NULL,
  category          ENUM('job','internship','scholarship') NOT NULL,
  description       TEXT,
  min_education     ENUM('certificate','diploma','undergraduate','graduate'),
  min_experience    DECIMAL(4,1) NOT NULL DEFAULT 0,
  location          VARCHAR(150),
  deadline          DATE,
  status            ENUM('active','closed','draft') NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE opportunity_tags (
  opportunity_id INT NOT NULL,
  tag_id         INT NOT NULL,
  PRIMARY KEY (opportunity_id, tag_id),
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)         REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. APPLICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE applications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  opportunity_id INT NOT NULL,
  status         ENUM('submitted','under_review','accepted','rejected') NOT NULL DEFAULT 'submitted',
  cover_note     TEXT NULL,
  applied_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_opportunity (student_id, opportunity_id),
  FOREIGN KEY (student_id)     REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. MATCH SCORES
-- Stores the breakdown per your weighted IR formula, not just the
-- total — useful for debugging/justifying scores in your report.
-- ---------------------------------------------------------------------
CREATE TABLE match_scores (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  opportunity_id   INT NOT NULL,
  skills_score     DECIMAL(5,2) NOT NULL,   -- weight 0.50
  education_score  DECIMAL(5,2) NOT NULL,   -- weight 0.15
  location_score   DECIMAL(5,2) NOT NULL,   -- weight 0.15 (text match, see below)
  experience_score DECIMAL(5,2) NOT NULL,   -- weight 0.10
  interest_score   DECIMAL(5,2) NOT NULL,   -- weight 0.10
  total_score      DECIMAL(5,2) NOT NULL,
  generated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_match (student_id, opportunity_id),
  FOREIGN KEY (student_id)     REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  opportunity_id INT NULL,
  message        VARCHAR(255) NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)     REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. ADMIN REPORTS (system-generated summaries)
-- ---------------------------------------------------------------------
CREATE TABLE reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT NOT NULL,
  report_type   VARCHAR(100) NOT NULL,
  generated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
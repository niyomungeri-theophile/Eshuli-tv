
-- Iyi SQL wayikoresha muri phpMyAdmin (Import)
-- Database: `eshulii tv`

CREATE DATABASE IF NOT EXISTS `eshulii tv`;
USE `eshulii tv`;

-- 1. Table y'abanyeshuri n'abakozi
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','student') DEFAULT 'student',
  `attendance_type` enum('online','physical') DEFAULT 'online',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table y'amasomo (Lessons)
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `video_url` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table ya Settings (Intake dates)
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shyiramo Admin wa mbere
INSERT IGNORE INTO `users` (`full_name`, `username`, `email`, `password`, `role`) 
VALUES ('System Admin', 'admin', 'admin@eshuli.rw', 'admin123', 'admin');

-- Shyiramo amatariki ya default
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES ('reg_start_date', '2025-01-01');
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES ('reg_end_date', '2025-12-31');

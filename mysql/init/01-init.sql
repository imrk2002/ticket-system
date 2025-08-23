-- Create databases
CREATE DATABASE IF NOT EXISTS schedule_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS reservation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users with privileges
CREATE USER IF NOT EXISTS 'schedule_user'@'%' IDENTIFIED BY 'schedule_password';
GRANT ALL PRIVILEGES ON schedule_db.* TO 'schedule_user'@'%';

CREATE USER IF NOT EXISTS 'reservation_user'@'%' IDENTIFIED BY 'reservation_password';
GRANT ALL PRIVILEGES ON reservation_db.* TO 'reservation_user'@'%';

FLUSH PRIVILEGES;


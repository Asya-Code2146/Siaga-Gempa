CREATE DATABASE IF NOT EXISTS siagagempa_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE siagagempa_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    endpoint TEXT NOT NULL,
    public_key TEXT,
    auth_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS earthquakes;

CREATE TABLE earthquakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    magnitude FLOAT NOT NULL,
    depth VARCHAR(50),
    location VARCHAR(255),
    time DATETIME,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    tsunami VARCHAR(100) DEFAULT 'Tidak berpotensi tsunami',
    dirasakan VARCHAR(255) DEFAULT '-',
    shakemap VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_eq (latitude, longitude, time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
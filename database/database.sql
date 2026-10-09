CREATE DATABASE IF NOT EXISTS siagagempa_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE siagagempa_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    endpoint TEXT NOT NULL,
    public_key TEXT,
    auth_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS earthquakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE,
    magnitude FLOAT NOT NULL,
    depth INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    time_str VARCHAR(100) NOT NULL,
    date_time DATETIME NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    tsunami_potential VARCHAR(100) DEFAULT 'Tidak berpotensi tsunami',
    tsunami_alert_state VARCHAR(50) DEFAULT 'none',
    dirasakan VARCHAR(255) DEFAULT '-',
    shakemap VARCHAR(500) DEFAULT '',
    is_realtime TINYINT(1) DEFAULT 0,
    is_simulation TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_datetime (date_time),
    INDEX idx_mag (magnitude),
    INDEX idx_coords (latitude, longitude),
    INDEX idx_tsunami (tsunami_alert_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evacuation_shelters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('gedung_tsunami', 'tempat_tinggi', 'titik_kumpul_terbuka') NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    elevation_meters INT DEFAULT 0,
    capacity INT DEFAULT 0,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Aceh',
    verified_by VARCHAR(100) DEFAULT 'BPBD Aceh',
    verification_status ENUM('terverifikasi', 'dalam_peninjauan') DEFAULT 'terverifikasi',
    facilities TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_shelter_coords (latitude, longitude),
    INDEX idx_shelter_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    http_code INT DEFAULT 200,
    records_synced INT DEFAULT 0,
    message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO evacuation_shelters (name, type, latitude, longitude, elevation_meters, capacity, address, city, verified_by, facilities) VALUES
('Gedung Evakuasi Tsunami Lambung (TES Lambung)', 'gedung_tsunami', 5.5412, 95.3045, 18, 1200, 'Gampong Lambung, Kec. Meuraxa', 'Banda Aceh', 'BPBD Kota Banda Aceh / BNPB', 'Rooftop evakuasi, tangga darurat ganda, sirene EWS, tangki air cadangan'),
('Gedung Evakuasi Tsunami Deah Glumpang', 'gedung_tsunami', 5.5563, 95.2981, 18, 1000, 'Gampong Deah Glumpang, Kec. Meuraxa', 'Banda Aceh', 'BPBD Kota Banda Aceh / BNPB', 'Akses landai kursi roda, generator darurat, ruang P3K'),
('Gedung Evakuasi Tsunami Alue Deah Teungoh', 'gedung_tsunami', 5.5512, 95.2905, 18, 1500, 'Gampong Alue Deah Teungoh, Kec. Meuraxa', 'Banda Aceh', 'BPBD Kota Banda Aceh / BNPB', 'Rooftop shelter, persediaan darurat, helipad pendaratan ringan'),
('Gedung Escape Building Kantor TDMRC USK', 'gedung_tsunami', 5.5788, 95.3421, 16, 800, 'Jl. Prof. Dr. Abdurrahman Lubis, Syiah Kuala', 'Banda Aceh', 'TDMRC Universitas Syiah Kuala', 'Pusat riset kebencanaan, cadangan logistik, radio komunikasi VHF'),
('Kawasan Dataran Tinggi Mata Ie Hill', 'tempat_tinggi', 5.5015, 95.2891, 75, 5000, 'Kecamatan Darul Imarah, Aceh Besar', 'Aceh Besar', 'BPBD Aceh Besar', 'Zona tinggi bebas genangan tsunami, akses jalan lintas provinsi'),
('Lapangan Blang Padang', 'titik_kumpul_terbuka', 5.5526, 95.3175, 4, 10000, 'Jl. Iskandar Muda, Baiturrahman', 'Banda Aceh', 'BPBD Kota Banda Aceh', 'Zona evakuasi gempa datar terbuka bebas runtuhan bangunan, posko kesehatan utama'),
('Stadion Harapan Bangsa Lhong Raya', 'titik_kumpul_terbuka', 5.5218, 95.3283, 7, 15000, 'Lhong Raya, Banda Raya', 'Banda Aceh', 'Dispora / BPBD Aceh', 'Area lapang luas, genset pusat, tenda darurat dan helipad darurat')
ON DUPLICATE KEY UPDATE name=VALUES(name);
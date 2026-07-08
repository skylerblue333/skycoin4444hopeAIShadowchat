-- Add user_photos table for storing user gallery photos
CREATE TABLE IF NOT EXISTS user_photos (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  photo_key VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  is_profile_picture BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_profile_picture (is_profile_picture)
);

# Dell PowerEdge R630 Deployment Guide for SKY444 Beta

**Target:** Official Beta Hosting at `beta.sky444.com`
**Hardware:** Dell PowerEdge R630
**OS:** Ubuntu Server 24.04 LTS
**Status:** Production Ready

---

## Table of Contents

1. [Hardware Overview](#hardware-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [OS Installation](#os-installation)
4. [Network Configuration](#network-configuration)
5. [Storage Setup](#storage-setup)
6. [Database Setup](#database-setup)
7. [Application Deployment](#application-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Disaster Recovery](#disaster-recovery)
10. [Performance Tuning](#performance-tuning)

---

## Hardware Overview

### Dell PowerEdge R630 Specifications

```
Physical Specifications:
├── Form Factor: 1U Rack Server
├── Dimensions: 43.8 x 19.1 x 4.3 cm
├── Weight: ~20 kg
└── Rack Units: 1U

Processors:
├── CPU Count: 2 (Dual Socket)
├── CPU Model: Intel Xeon E5-2680 v4
├── Cores per CPU: 14 (28 total)
├── Threads per CPU: 28 (56 total)
├── Base Frequency: 2.4 GHz
├── Max Turbo: 3.3 GHz
└── Cache: 35 MB L3 per CPU

Memory:
├── Slots: 24 DIMM slots
├── Capacity: 256 GB (24 x 16GB)
├── Type: DDR4 RDIMM
├── Speed: 2400 MHz
├── Voltage: 1.2V
└── ECC: Yes (Error Correcting Code)

Storage:
├── Drive Bays: 10 x 2.5" SAS
├── Drive Type: SAS 10K RPM
├── Drive Capacity: 1.2 TB each
├── Total Capacity: 12 TB
├── RAID: Supported (0, 1, 5, 6, 10)
└── Controller: PERC H730 Mini

Network:
├── Onboard NICs: 4 x 1GbE (1000 Mbps)
├── Optional NICs: 2 x 10GbE (10 Gbps)
├── Redundancy: Teaming/Bonding
└── Management: iDRAC8

Power:
├── PSU Count: 2 (Redundant)
├── PSU Rating: 750W each
├── Total Power: 1500W
├── Efficiency: 90%+
└── Redundancy: N+1

Cooling:
├── Fan Count: 8 (Redundant)
├── Airflow: Hot-aisle optimized
├── Temperature Range: 10-35°C
└── Humidity: 20-80%
```

### Performance Metrics

```
Expected Performance:
├── Memory Bandwidth: ~120 GB/s
├── CPU Performance: ~1000 Gflops
├── Network Throughput: 4 Gbps (1GbE) or 20 Gbps (10GbE)
├── Storage IOPS: ~100K (SAS 10K)
└── Storage Throughput: ~1 GB/s

Capacity:
├── Concurrent Users: 10,000+
├── Transactions/sec: 50,000+
├── API Requests/sec: 100,000+
├── Mining Workers: 256+
└── Database Size: 1 TB+
```

---

## Pre-Deployment Checklist

### Hardware Preparation

- [ ] Unbox and inspect Dell R630
- [ ] Verify all components present
- [ ] Check for physical damage
- [ ] Install in rack with proper airflow
- [ ] Connect power cables (both PSUs)
- [ ] Connect network cables (primary + backup)
- [ ] Connect iDRAC management port
- [ ] Power on and verify POST (Power-On Self-Test)
- [ ] Enter BIOS and verify hardware
- [ ] Configure RAID array (RAID 6 recommended)
- [ ] Enable redundancy features

### Network Preparation

- [ ] Assign static IP address
- [ ] Configure DNS servers
- [ ] Setup firewall rules
- [ ] Configure VPN access (optional)
- [ ] Setup monitoring network
- [ ] Configure backup network
- [ ] Test network connectivity
- [ ] Verify bandwidth

### Documentation

- [ ] Gather Dell R630 manual
- [ ] Document hardware serial numbers
- [ ] Document network configuration
- [ ] Document admin credentials
- [ ] Create runbook for common tasks
- [ ] Setup change log

---

## OS Installation

### Step 1: BIOS Configuration

Access iDRAC:
```
URL: https://<server-ip>:443
Default User: root
Default Password: calvin
```

Configure BIOS:
```
1. System Settings
   ├── Boot Mode: UEFI
   ├── Boot Sequence: HDD first
   └── Secure Boot: Disabled (for Linux)

2. Power Management
   ├── CPU Power Management: Enabled
   ├── C States: Enabled
   └── Turbo Boost: Enabled

3. Memory Settings
   ├── Memory Operating Mode: Optimizer
   ├── Node Interleaving: Disabled
   └── Patrol Scrub: Enabled

4. Network Settings
   ├── Onboard NIC1: Enabled
   ├── Onboard NIC2: Enabled
   └── Onboard NIC3: Enabled

5. Storage Settings
   ├── SATA Mode: AHCI
   ├── RAID: Enabled
   └── Embedded Storage: Enabled
```

### Step 2: RAID Configuration

Create RAID 6 array:
```
1. Boot into PERC H730 configuration
2. Select "Create Virtual Disk"
3. Configuration:
   ├── RAID Level: RAID 6
   ├── Stripe Block Size: 64KB
   ├── Read Policy: Read-Ahead
   ├── Write Policy: Write-Back
   └── I/O Policy: Direct
4. Initialize array
5. Verify in iDRAC
```

### Step 3: Ubuntu Installation

Download Ubuntu Server 24.04 LTS:
```bash
# Create bootable USB
sudo dd if=ubuntu-24.04-live-server-amd64.iso of=/dev/sdb bs=4M
sync

# Or use Rufus on Windows
```

Boot and install:
```
1. Boot from USB
2. Select "Try or Install Ubuntu Server"
3. Installation steps:
   ├── Language: English
   ├── Keyboard: US
   ├── Network: Configure static IP
   ├── Storage: Select RAID array
   ├── Filesystem: ext4
   ├── Hostname: sky444-beta
   ├── Username: ubuntu
   ├── Password: [strong password]
   └── SSH: Enable
4. Wait for installation (~10 minutes)
5. Reboot
```

### Step 4: Post-Installation Setup

```bash
# Update system
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Install essential tools
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  htop \
  iotop \
  nethogs \
  tmux \
  vim \
  nano

# Configure SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes
sudo systemctl restart ssh

# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3306/tcp
sudo ufw allow 6379/tcp
```

---

## Network Configuration

### Static IP Configuration

```bash
# Edit netplan config
sudo nano /etc/netplan/00-installer-config.yaml
```

Configuration:
```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
    eth1:
      dhcp4: no
      addresses:
        - 192.168.2.100/24
  bonds:
    bond0:
      interfaces: [eth0, eth1]
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      parameters:
        mode: active-backup
        mii-monitor-interval: 100
```

Apply configuration:
```bash
sudo netplan apply
sudo netplan get
```

### DNS Configuration

```bash
# Edit resolv.conf
sudo nano /etc/resolv.conf

# Add:
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1

# Make persistent
sudo nano /etc/netplan/00-installer-config.yaml
# Add nameservers section
```

### Firewall Rules

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL
sudo ufw allow 3306/tcp

# Allow Redis
sudo ufw allow 6379/tcp

# Allow monitoring
sudo ufw allow 9090/tcp
sudo ufw allow 9100/tcp

# Allow mining ports
sudo ufw allow 3333/tcp
sudo ufw allow 3334/tcp
sudo ufw allow 3335/tcp

# View rules
sudo ufw status numbered

# Enable firewall
sudo ufw enable
```

---

## Storage Setup

### Disk Partitioning

```bash
# View disks
sudo lsblk

# Create partitions
sudo parted /dev/sda
(parted) mklabel gpt
(parted) mkpart primary 1MiB 512MiB
(parted) mkpart primary 512MiB 100%
(parted) set 1 boot on
(parted) quit

# Format partitions
sudo mkfs.fat -F 32 /dev/sda1
sudo mkfs.ext4 /dev/sda2

# Mount partitions
sudo mkdir -p /mnt/data
sudo mount /dev/sda2 /mnt/data
```

### Storage Optimization

```bash
# Enable SSD caching (if using SSD)
sudo apt install -y bcache-tools

# Configure I/O scheduler
echo "deadline" | sudo tee /sys/block/sda/queue/scheduler

# Optimize filesystem
sudo tune2fs -m 1 /dev/sda2

# Enable ext4 features
sudo tune2fs -O dir_index,extent,filetype /dev/sda2
```

### Backup Configuration

```bash
# Create backup directory
sudo mkdir -p /mnt/backup

# Setup automated backups
sudo crontab -e

# Add:
0 2 * * * mysqldump -u root -p$MYSQL_PASSWORD skycoin > /mnt/backup/skycoin_$(date +\%Y\%m\%d).sql
0 3 * * * tar -czf /mnt/backup/app_$(date +\%Y\%m\%d).tar.gz /home/ubuntu/skycoin4444

# Verify backups
ls -lh /mnt/backup/
```

---

## Database Setup

### MySQL Installation

```bash
# Install MySQL 8.0
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Verify installation
mysql --version
sudo systemctl status mysql
```

### Database Configuration

```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add:
[mysqld]
bind-address = 0.0.0.0
max_connections = 1000
max_allowed_packet = 256M
innodb_buffer_pool_size = 128G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Create Database and User

```bash
# Connect to MySQL
sudo mysql -u root

# Create database
CREATE DATABASE skycoin;
CREATE DATABASE skycoin_beta;

# Create user
CREATE USER 'skycoin_user'@'localhost' IDENTIFIED BY 'strong_password_here';
CREATE USER 'skycoin_beta'@'localhost' IDENTIFIED BY 'beta_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON skycoin.* TO 'skycoin_user'@'localhost';
GRANT ALL PRIVILEGES ON skycoin_beta.* TO 'skycoin_beta'@'localhost';

# Flush privileges
FLUSH PRIVILEGES;

# Exit
EXIT;
```

### Verify Database

```bash
# Test connection
mysql -u skycoin_user -p skycoin -e "SELECT 1;"

# View databases
mysql -u skycoin_user -p skycoin -e "SHOW DATABASES;"

# View tables
mysql -u skycoin_user -p skycoin -e "SHOW TABLES;"
```

---

## Application Deployment

### Clone Repository

```bash
# Clone SKY444
cd /home/ubuntu
git clone https://github.com/skylerblue333/skycoin4444.git
cd skycoin4444

# Verify clone
ls -la
git log --oneline | head -5
```

### Install Dependencies

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify installations
node --version
npm --version
pnpm --version

# Install project dependencies
pnpm install

# Verify dependencies
pnpm list | head -20
```

### Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit configuration
nano .env.production

# Production settings:
NODE_ENV=production
DATABASE_URL=mysql://skycoin_beta:beta_password_here@localhost:3306/skycoin_beta
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_WALLET_ADDRESS=0x... (your wallet address)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
OPENAI_API_KEY=sk-...
MINING_ENABLED=true
BETA_MODE=true
```

### Build Application

```bash
# Build frontend
pnpm build

# Build backend
pnpm build:server

# Verify builds
ls -la dist/
ls -la server/dist/

# Check build size
du -sh dist/
du -sh server/dist/
```

### Database Migration

```bash
# Generate migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Verify schema
mysql -u skycoin_beta -p skycoin_beta -e "SHOW TABLES;"

# Count tables
mysql -u skycoin_beta -p skycoin_beta -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='skycoin_beta';"
```

### Setup Systemd Services

Create backend service:
```bash
sudo nano /etc/systemd/system/sky444-backend.service
```

Content:
```ini
[Unit]
Description=SKY444 Backend Service
After=network.target mysql.service redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/skycoin4444
Environment="NODE_ENV=production"
Environment="DATABASE_URL=mysql://skycoin_beta:beta_password_here@localhost:3306/skycoin_beta"
Environment="JWT_SECRET=$(openssl rand -base64 32)"
ExecStart=/usr/bin/node server/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/sky444-backend.log
StandardError=append:/var/log/sky444-backend.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sky444-backend
sudo systemctl start sky444-backend
sudo systemctl status sky444-backend

# View logs
sudo tail -f /var/log/sky444-backend.log
```

### Setup Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Configure:
```bash
sudo nano /etc/nginx/sites-available/sky444
```

Content:
```nginx
upstream sky444_backend {
  server 127.0.0.1:3001;
  keepalive 32;
}

server {
  listen 80;
  server_name beta.sky444.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name beta.sky444.com;

  ssl_certificate /etc/ssl/certs/sky444.crt;
  ssl_certificate_key /etc/ssl/private/sky444.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
  gzip_min_length 1000;

  # Frontend
  location / {
    root /home/ubuntu/skycoin4444/dist;
    try_files $uri /index.html;
    expires 1h;
    add_header Cache-Control "public, immutable";
  }

  # API
  location /api {
    proxy_pass http://sky444_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 60s;
  }

  # WebSocket
  location /ws {
    proxy_pass http://sky444_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  # Health check
  location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
  }
}
```

Enable and start:
```bash
sudo ln -s /etc/nginx/sites-available/sky444 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Monitoring & Maintenance

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y prometheus node-exporter grafana-server

# Start services
sudo systemctl start prometheus
sudo systemctl start node-exporter
sudo systemctl start grafana-server

# Access Grafana
# URL: http://localhost:3000
# Default: admin/admin
```

### Log Management

```bash
# View application logs
sudo tail -f /var/log/sky444-backend.log

# View system logs
sudo journalctl -u sky444-backend -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Setup log rotation
sudo nano /etc/logrotate.d/sky444

# Content:
/var/log/sky444-backend.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 ubuntu ubuntu
  sharedscripts
  postrotate
    systemctl reload sky444-backend > /dev/null 2>&1 || true
  endscript
}
```

### Performance Monitoring

```bash
# CPU usage
top

# Memory usage
free -h

# Disk usage
df -h

# Network traffic
nethogs

# Database performance
mysql -u skycoin_beta -p skycoin_beta -e "SHOW PROCESSLIST;"

# Slow queries
mysql -u skycoin_beta -p skycoin_beta -e "SELECT * FROM mysql.slow_log;"
```

### Backup & Recovery

```bash
# Backup database
mysqldump -u skycoin_beta -p skycoin_beta > /mnt/backup/skycoin_beta_$(date +%Y%m%d_%H%M%S).sql

# Backup application
tar -czf /mnt/backup/app_$(date +%Y%m%d_%H%M%S).tar.gz /home/ubuntu/skycoin4444

# Verify backups
ls -lh /mnt/backup/

# Restore database
mysql -u skycoin_beta -p skycoin_beta < /mnt/backup/skycoin_beta_20260703_120000.sql

# Restore application
tar -xzf /mnt/backup/app_20260703_120000.tar.gz -C /home/ubuntu/
```

---

## Disaster Recovery

### Backup Strategy

**Daily Backups:**
```bash
# Database backup every 6 hours
0 */6 * * * mysqldump -u skycoin_beta -p$MYSQL_PASSWORD skycoin_beta > /mnt/backup/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# Application backup daily
0 2 * * * tar -czf /mnt/backup/app_$(date +\%Y\%m\%d).tar.gz /home/ubuntu/skycoin4444
```

**Off-site Backups:**
```bash
# Sync to S3
0 3 * * * aws s3 sync /mnt/backup s3://sky444-backups/dell-r630/

# Sync to secondary server
0 4 * * * rsync -avz /mnt/backup/ backup@secondary:/mnt/sky444-backups/
```

### Recovery Procedures

**Database Recovery:**
```bash
# Stop application
sudo systemctl stop sky444-backend

# Restore database
mysql -u skycoin_beta -p skycoin_beta < /mnt/backup/skycoin_beta_latest.sql

# Verify data
mysql -u skycoin_beta -p skycoin_beta -e "SELECT COUNT(*) FROM users;"

# Start application
sudo systemctl start sky444-backend
```

**Full Server Recovery:**
```bash
# 1. Reinstall OS
# 2. Configure network
# 3. Install dependencies
# 4. Restore database
# 5. Restore application
# 6. Start services
# 7. Verify functionality
```

---

## Performance Tuning

### CPU Optimization

```bash
# Enable CPU frequency scaling
sudo apt install -y cpufrequtils

# Set governor to performance
echo "performance" | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Verify
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
```

### Memory Optimization

```bash
# View memory usage
free -h

# Optimize MySQL buffer pool
# In /etc/mysql/mysql.conf.d/mysqld.cnf:
innodb_buffer_pool_size = 200G

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Disk Optimization

```bash
# Enable SSD caching
sudo apt install -y bcache-tools

# Optimize I/O scheduler
echo "deadline" | sudo tee /sys/block/sda/queue/scheduler

# Check disk performance
sudo fio --name=randread --ioengine=libaio --iodepth=32 --rw=randread --bs=4k --direct=1 --size=1G --numjobs=4 --runtime=60 --time_based --group_reporting
```

### Network Optimization

```bash
# Increase network buffer
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 67108864"
sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 67108864"

# Enable TCP fast open
sudo sysctl -w net.ipv4.tcp_fastopen=3

# Increase connection backlog
sudo sysctl -w net.core.somaxconn=65535
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535

# Make persistent
sudo nano /etc/sysctl.conf
# Add all settings above
sudo sysctl -p
```

---

**Last Updated:** July 3, 2026
**Version:** 1.0.0
**Status:** Production Ready

**For Support:** support@sky444.com | GitHub: https://github.com/skylerblue333/skycoin4444

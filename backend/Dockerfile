FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends tshark build-essential vsftpd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# Create FTP user and directory
RUN useradd -m -s /bin/bash testuser && \
    echo "testuser:testpass" | chpasswd && \
    mkdir -p /home/testuser && \
    chown testuser:testuser /home/testuser

# Configure vsftpd
RUN echo "listen=YES\n\
listen_ipv6=NO\n\
anonymous_enable=NO\n\
local_enable=YES\n\
write_enable=YES\n\
local_umask=022\n\
dirmessage_enable=YES\n\
use_localtime=YES\n\
xferlog_enable=YES\n\
connect_from_port_20=YES\n\
chroot_local_user=YES\n\
secure_chroot_dir=/var/run/vsftpd/empty\n\
pam_service_name=vsftpd\n\
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem\n\
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key\n\
ssl_enable=NO\n\
pasv_enable=YES\n\
pasv_min_port=30000\n\
pasv_max_port=30009\n\
pasv_address=10.50.0.10" > /etc/vsftpd.conf

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]


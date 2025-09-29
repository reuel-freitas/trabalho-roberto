#!/bin/bash

# Start FTP server in background
vsftpd /etc/vsftpd.conf &

# Start FastAPI application
uvicorn app:app --host 0.0.0.0 --port 8000

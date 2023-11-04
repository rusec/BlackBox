#!/bin/bash
# Dependencies: Lynis, rkhunter

# Copy sshd_config
# TODO: Test SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config_old
sudo mv ./sshd_config /etc/ssh/sshd_config
sudo systemctl restart ssh

# Copy sysctl.conf
# TODO: Test sysctl config
sudo cp /etc/sysctl.conf /etc/sysctl_old.conf
sudo mv ./sysctl.conf /etc/sysctl.conf
sudo sysctl -p

# Copy system.conf


# Add common malicious ports to firewall


# Misc. Hardening
sudo chmod 027 /etc/login.defs

# Run rkhunter
#rkhunter &

# Run Lynis as background and output to log file
#lynis audit system &
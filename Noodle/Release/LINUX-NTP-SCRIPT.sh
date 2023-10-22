# Check if the script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo privileges."
   exit 1
fi

# Detect Linux distribution and install chrony if not already installed
if command -v apt-get &> /dev/null; then
    echo "Debian/Ubuntu based distribution detected."
    sudo apt-get update
    sudo apt-get install -y chrony
elif command -v yum &> /dev/null; then
    echo "Red-Hat/CentOS/Fedora based distribution detected."
    sudo yum install -y chrony
else
    echo "Error: Unable to detect distribution or package manager. Please install chrony manually."
    exit 1
fi

# Prompt user for NTP server input
read -p "Please enter an NTP server to connect to: " ntp_server

# Backup current chrony configuration
cp /etc/chrony/chrony.conf /etc/chrony/chrony.conf.backup

# Configure the NTP server
echo "server $ntp_server iburst" > /etc/chrony/chrony.conf

# Restart chronyd service
systemctl restart chrony || systemctl restart chronyd  # Some systems name the service "chrony" and others "chronyd"

# Ensure chronyd starts on boot
systemctl enable chrony || systemctl enable chronyd

# Display synchronization status
chronyc tracking

echo "NTP configuration updated and time resynchronized with $ntp_server."

chronyc tracking

timedatectl status

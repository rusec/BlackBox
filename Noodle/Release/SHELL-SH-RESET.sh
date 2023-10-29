# Check if user is running the script as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

# Checking for Aliased Commands
echo "Checking for aliased commands..."
if alias | grep -qE 'ls|cd|echo|rm'; then
    echo "Suspicious aliases found. Consider checking and unaliasing them:"
    alias | grep -E 'ls|cd|echo|rm'
else
    echo "No suspicious aliases detected."
fi

echo "Users with sudo privileges:"

# List all usernames from /etc/passwd and check their sudo privileges
while IFS=: read -r username _ uid gid _ _ _; do
    # Only check for non-system users (typically UID >= 1000)
    if [ "$uid" -ge 1000 ]; then #UID>=1000 users non system users 
        
        if sudo -l -U "$username" &>/dev/null; then
            echo "$username"
        fi
    fi
done </etc/passwd



#Cleanse and reset bashrc

# Define the path for the default .bashrc
default="/etc/skel/.bashrc"

# Verify default .bashrc file exists
if [ ! -f "$default" ]; then
    echo "The default .bashrc file does not exist. Cannot reset to default."
    exit 1
fi

# Remove the current .bashrc 
echo "Removing the current .bashrc file..."
rm -f ~/.bashrc

# Check if the removal was successful
if [ -f ~/.bashrc ]; then
    echo "Failed to remove the current .bashrc file."
    exit 1
fi


echo "Copying the default .bashrc file to your home directory..."
cp "$default" ~/.bashrc
if [ ! -f ~/.bashrc ]; then
    echo "Failed to copy the default .bashrc file."
    exit 1
fi

echo "The .bashrc file has been successfully reset."

# Resetting bash permissions
echo "Resetting permissions for bash..."
chmod 755 /bin/bash

# Displaying the updated permissions
ls -l /bin/bash

echo "Checks completed."

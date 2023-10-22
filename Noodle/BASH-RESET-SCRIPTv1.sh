#!/bin/bash

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

# Resetting bash permissions
echo "Resetting permissions for bash..."
chmod 755 /bin/bash

# Displaying the updated permissions
ls -l /bin/bash

echo "Checks completed."

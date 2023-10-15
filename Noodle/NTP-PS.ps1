# PowerShell Script to Turn on NTP for East Coast

$NTPServers = "time.windows.com,0x1"

w32tm /config /manualpeerlist:$NTPServers /syncfromflags:manual /reliable:YES /update

# Restart time service 
Restart-Service w32time

# Resynch the clock 
w32tm /resync

# Output the configuration
w32tm /query /status

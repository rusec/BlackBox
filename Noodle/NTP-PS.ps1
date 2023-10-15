# PowerShell Script to Turn on NTP for East Coast

$NTPServers = "time.windows.com,0x1"

w32tm /config /manualpeerlist:$NTPServers /syncfromflags:manual /reliable:YES /update

# Restart time service 
Restart-Service w32time

# Resynch the clock 
w32tm /resync

# Output the configuration
w32tm /query /status

####V2?
$NTPServers = "time.google.com,0x1"
w32tm /config /manualpeerlist:$NTPServers /syncfromflags:manual /reliable:YES /update
Restart-Service w32time
w32tm /resync

###BRAIN

Get-Service w32time | Set-Service -StartupType Automatic

# Start the Windows Time service if not already running
if ((Get-Service w32time).Status -ne 'Running') {
    Start-Service w32time
}

 #(default Microsoft servers used here, you can replace this)
##$NTPServers = "time.windows.com,0x1"
$NTPServers = "us.pool.ntp.org,0x1 north-america.pool.ntp.org,0x1"



w32tm /config /manualpeerlist:$NTPServers /syncfromflags:manual /reliable:YES /update


Restart-Service w32time

w32tm /resync /rediscover

w32tm /query /status

Write-Output "NTP configuration updated and time resynchronized."

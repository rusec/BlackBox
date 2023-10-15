##VERSION 1

Get-Service w32time | Set-Service -StartupType Automatic

# Start the Windows Time service if not already running
if ((Get-Service w32time).Status -ne 'Running') {
    Start-Service w32time
}

 $NTPServers = "time.windows.com,0x1"


w32tm /config /manualpeerlist:$NTPServers /syncfromflags:manual /reliable:YES /update


Restart-Service w32time

w32tm /resync /rediscover

w32tm /query /status

Write-Output "NTP configuration updated and time resynchronized."

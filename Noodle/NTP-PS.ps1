#VERSION 2 WORKS FOR WINDOWS! BALLER! currently can use 4 ntp servers subject have more or less added

Get-Service w32time | Set-Service -StartupType Automatic

Get-Service w32time | Set-Service -StartupType Automatic

# Start the Windows Time service if not already running
if ((Get-Service w32time).Status -ne 'Running') {
    Start-Service w32time
}


$DefaultNTPServers = "time.windows.com,0x1"

$UserInput = Read-Host "Please enter an NTP to connect to: NIST-EST, NIST-MST, ProxMox, Cloudflare"

$UserDefinedNTPServers 

switch ($UserInput) {
    "NIST-EST" {
        $UserDefinedNTPServers = "time-a-g.nist.gov"   #NIST NTP MARYLAND (UTC-5)
    }
    "NIST-MST" {
        $UserDefinedNTPServers = "time-a-wwv.nist.gov"   #NIST NTP COLORADO (UTC-7)
    }
    "ProxMox" {
        $UserDefinedNTPServers = "128.6.1.1"  #Proxmox NTP sevrer 
    }
    "Cloudflare"{
        $UserDefinedNTPServers = "time.cloudflare.com"  #Cloudfare
    }
    default {
        $UserDefinedNTPServers = $DefaultNTPServers #Default NTP to be always set back to windows 
    }
}


w32tm /config /manualpeerlist:$UserDefinedNTPServers /syncfromflags:manual /reliable:YES /update


Restart-Service w32time

w32tm /resync /rediscover

w32tm /query /status

Write-Output "NTP configuration updated and time resynchronized."


##CHECK YOU'RE ON THE SELECETED NTP SEVER 
$ntpServers = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\W32Time\Parameters" -Name NtpServer | Select-Object -ExpandProperty NtpServer

Write-Output "Current NTP Server(s): $ntpServers"

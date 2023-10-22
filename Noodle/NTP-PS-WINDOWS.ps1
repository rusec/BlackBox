function ConfigureWindowsNTP {
    # Check if the OS is Windows
    $os = Get-CimInstance -ClassName Win32_OperatingSystem

    if ($os.Caption -like "*Windows*") {
        
        Get-Service w32time | Set-Service -StartupType Automatic
        Get-Service w32time | Set-Service -StartupType Automatic

        # Start the Windows Time service if not already running
        if ((Get-Service w32time).Status -ne 'Running') {
            Start-Service w32time
        }

        $DefaultNTPServers = "time.windows.com,0x1"
        $UserInput = Read-Host "Please enter an NTP to connect to:"
        $UserDefinedNTPServers = $UserInput


        w32tm /config /manualpeerlist:$UserDefinedNTPServers /syncfromflags:manual /reliable:YES /update
        Restart-Service w32time
        w32tm /resync /rediscover
        w32tm /query /status
        Write-Output "NTP configuration updated and time resynchronized."

        # Check you're on the selected NTP server
        $ntpServers = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\W32Time\Parameters" -Name NtpServer | Select-Object -ExpandProperty NtpServer
        Write-Output "Current NTP Server(s): $ntpServers"
        
    } else {
        Write-Output "The current operating system is not Windows. Exiting."
    }
}

# Call the function
ConfigureWindowsNTP

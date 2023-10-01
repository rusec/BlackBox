##Get History
# Define the cmdHistoryFile to store the command history on the Desktop
$cmdHistoryFile = "$env:USERPROFILE\Desktop\cmd_history.txt"

# Check if the history file exists and display its content
if (Test-Path -Path $cmdHistoryFile) {
    Write-Host "Command History:"
    Get-Content -Path $cmdHistoryFile | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No command history found."
}


###Checking Policy restricitons of CMD
$registryPath = "HKCU:\Software\Policies\Microsoft\Windows\System"

$disableCMD = Get-ItemProperty -Path $registryPath -Name "DisableCMD" -ErrorAction SilentlyContinue

if ($null -ne $disableCMD) { ##Checks if if wether a registry key was retrived and stored in disableCMD variable 
    switch ($disableCMD.DisableCMD) { #Enter switch check CMD properties 
        0 { Write-Host "CMD not restricted." }
        1 { Write-Host "CMD restricted. User can not run batch files." }
        2 { Write-Host "CMD is completely disabled." }
        default { Write-Host "Unknown restriction." }
    }
} else {
    Write-Host "No restriction policy is set for CMD."
}


###Reset Access control list 
$cmdPath = "$env:windir\System32\cmd.exe"


if((Get-Item $cmdPath).IsReadOnly) { # Check if cmd.exe is Read-Only
    Set-ItemProperty -Path $cmdPath -Name IsReadOnly -Value $false #Changes Read only attribute to false 
    Write-Host "Read-Only attribute has been removed from cmd.exe."
} else {
    Write-Host "cmd is not to Read-Only."
}

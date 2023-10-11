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


# Define the path to cmd.exe
$cmdPath = "$env:SystemRoot\System32\cmd.exe"

# Reset the permissions to default for cmd.exe
icacls $cmdPath /reset

# Output the updated permissions
icacls $cmdPath

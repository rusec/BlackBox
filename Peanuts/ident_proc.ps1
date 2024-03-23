$processes = get-process
foreach ($process in $processes) { 
$obj = (Get-WmiObject -Class Win32_Process -filter "ProcessID = $($process.Id)")
if ($obj -ne $null) {
$owner = $obj.GetOwner().User
}

Write-Host "Proc Name: $($process.ProcessName)"
Write-Host "File Loc: $($process.Path)"
Write-Host "User: $owner"
Write-Host "-------------------------------"
}
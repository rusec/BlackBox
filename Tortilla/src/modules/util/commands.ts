const commands = {
    password: {
        darwin: {
            step_1: (user: string, oldPass: string, pass: string) => `dscl . -passwd /Users/${user} ${oldPass} ${pass}`,
        },
        freebsd: {
            step_1: (bcrypt_pass: string, user: string) => `chpass -p '${bcrypt_pass + ""}' ${user}`,
            step_2: (bcrypt_pass: string, user: string) => `usermod -p '${bcrypt_pass + ""}' ${user}`,
        },
        linux: {
            step_1: (ch_pass_string: string) => `echo '${ch_pass_string}' | sudo chpasswd -e`,
            step_2: (ch_pass_string: string) => `echo '${ch_pass_string}' | chpasswd -e`,
            step_3: (sudo_pass: string, ch_pass_string: string) => `echo -e '${sudo_pass}\n${ch_pass_string}' | sudo -S chpasswd -e`,
        },
    },
    ssh: {
        eject: {
            windows: (ssh_key: string) =>
                `powershell Add-Content -Force -Path $env:ProgramData\\ssh\\administrators_authorized_keys -Value '${ssh_key}';icacls.exe ""$env:ProgramData\\ssh\\administrators_authorized_keys"" /inheritance:r /grant ""Administrators:F"" /grant ""SYSTEM:F""`,
            linux: (ssh_key: string) => `mkdir -p ~/.ssh && echo '${ssh_key}' | && cat >> ~/.ssh/authorized_keys`,
        },
        remove: {
            windows: (ssh_key: string) =>
                `powershell -command \"$keyToRemove = \\"${ssh_key}\\";$authorizedKeysPath = Join-Path $env:ProgramData \\"ssh\\administrators_authorized_keys\\"; $authorizedKeysContent = Get-Content -Path $authorizedKeysPath; $authorizedKeysContent = $authorizedKeysContent -notmatch [regex]::Escape($keyToRemove); $authorizedKeysContent | Set-Content -Path $authorizedKeysPath; icacls.exe $authorizedKeysPath /inheritance:r /grant \\"Administrators:F\\" /grantclear \\"SYSTEM:F\\"; Write-Host \\"SSH key removal complete.\\"\"`,
            linux: (ssh_key: string) => `ssh_key="${ssh_key}" && sed -i 's/$ssh_key//g' ~/.ssh/authorized_keys`,
        },
        echo: {
            windows: `powershell cat "$env:ProgramData\\ssh\\administrators_authorized_keys"`,
            linux: "cat ~/.ssh/authorized_keys",
        },
    },
};

export { commands };

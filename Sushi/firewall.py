import subprocess
import os_detection

def check_iptables(port, protocol, state):
    if os_detection.detect() == "Linux":    
        try:
            command = "iptables -L OUTPUT -n"
            output = subprocess.check_output(command, shell=True, universal_newlines=True)
        except subprocess.CalledProcessError as e:
            print("Error {}".format(e))


        result = output.split('\n')

        rule_TCP_DROP = "DROP       6    --  0.0.0.0/0            0.0.0.0/0            tcp dpt:{}".format(port)
        rule_TCP_ACCEPT = "ACCEPT     6    --  0.0.0.0/0            0.0.0.0/0            tcp dpt:{}".format(port)
        rule_UDP_DROP = "DROP       17   --  0.0.0.0/0            0.0.0.0/0            udp dpt:{}".format(port)
        rule_UDP_ACCEPT = "ACCEPT     17   --  0.0.0.0/0            0.0.0.0/0            udp dpt:{}".format(port)
    

        for line in result:
            if rule_TCP_DROP in line and protocol == "tcp" and state == "DROP":
                
                command = "iptables -D OUTPUT -p tcp --dport {} -j DROP".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_TCP_DROP))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

                
            if rule_TCP_ACCEPT in line and protocol == "tcp" and state == "ACCEPT":
                
                command = "iptables -D OUTPUT -p tcp --dport {} -j ACCEPT".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_TCP_ACCEPT))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

            if rule_UDP_DROP in line and protocol == "udp" and state == "DROP":
                
                command = "iptables -D OUTPUT -p udp --dport {} -j DROP".format(port)

                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_UDP_DROP))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

            if rule_UDP_ACCEPT in line and protocol == "udp" and state == "ACCEPT":
                
                command = "iptables -D OUTPUT -p udp --dport {} -j ACCEPT".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_UDP_ACCEPT))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))


        try:
            command = "iptables -L INPUT -n"
            output = subprocess.check_output(command, shell=True, universal_newlines=True)
        except subprocess.CalledProcessError as e:
            print("Error {}".format(e))


        result = output.split('\n')

        rule_TCP_DROP = "DROP       6    --  0.0.0.0/0            0.0.0.0/0            tcp dpt:{}".format(port)
        rule_TCP_ACCEPT = "ACCEPT     6    --  0.0.0.0/0            0.0.0.0/0            tcp dpt:{}".format(port)
        rule_UDP_DROP = "DROP       17   --  0.0.0.0/0            0.0.0.0/0            udp dpt:{}".format(port)
        rule_UDP_ACCEPT = "ACCEPT     17   --  0.0.0.0/0            0.0.0.0/0            udp dpt:{}".format(port)
    

        for line in result:
            if rule_TCP_DROP in line and protocol == "tcp" and state == "DROP":
                
                command = "iptables -D INPUT -p tcp --dport {} -j DROP".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_TCP_DROP))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

                
            if rule_TCP_ACCEPT in line and protocol == "tcp" and state == "ACCEPT":
                
                command = "iptables -D INPUT -p tcp --dport {} -j ACCEPT".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_TCP_ACCEPT))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

            if rule_UDP_DROP in line and protocol == "udp" and state == "DROP":
                
                command = "iptables -D INPUT -p udp --dport {} -j DROP".format(port)

                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_UDP_DROP))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))

            if rule_UDP_ACCEPT in line and protocol == "udp" and state == "ACCEPT":
                
                command = "iptables -D INPUT -p udp --dport {} -j ACCEPT".format(port)
                try:
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    print("Rule removed : {}\n".format(rule_UDP_ACCEPT))
                except subprocess.CalledProcessError as e:
                    print("Error {}".format(e))
    
    elif (os_detection.detect() == "Windows"):
        command = f"""Get-NetFirewallRule | Where-Object {{ $_.Direction -eq 'Inbound' -and $_.Protocol -eq '{protocol}' -and $_.LocalPort -eq {port} -and $_.Action -eq '{state}' }} | ForEach-Object {{
        Remove-NetFirewallRule -Name $_.Name"
        }}
        """
        try:
            subprocess.run(["powershell", "-Command", command], check=True)
        except subprocess.CalledProcessError as e:
            print("Error: {}".format(e))
        except Exception as e:
            print("Error: {}".format(e))
        
        command = f"""Get-NetFirewallRule | Where-Object {{ $_.Direction -eq 'Outbound' -and $_.Protocol -eq '{protocol}' -and $_.LocalPort -eq {port} -and $_.Action -eq '{state}' }} | ForEach-Object {{
        Remove-NetFirewallRule -Name $_.Name"
        }}
        """
        try:
            subprocess.run(["powershell", "-Command", command], check=True)
        except subprocess.CalledProcessError as e:
            print("Error: {}".format(e))
        except Exception as e:
            print("Error: {}".format(e))


    elif (os_detection.detect() == "freebsd"): #might be able to use for darwin as well
        try:
            result = subprocess.check_output(["pfctl", "-sr"], universal_newlines=True)
            result = output.splitlines()
        except subprocess.CalledProcessError as e:
            print("Error: {}".format(e))

        if (state == "pass"):
            rule_inbound = "{} in quick on egress proto {} from any to any port = {}".format(state, protocol, port)
        elif (state == "Block"):
            rule_inbound = "{} drop in quick on egress proto {} from any to any port = {}".format(state, protocol, port)

        if (state == "pass"):
            rule_outbound = "{} out quick on egress proto {} from any to any port = {}".format(state, protocol, port)
        elif (state == "Block"):
            rule_outbound = "{} drop out quick on egress proto {} from any to any port = {}".format(state, protocol, port)



        modified = False
        new_pf_rules = []
        for rule in result:
            if rule.strip() == rule_inbound or rule.strip() == rule_outbound:
                modified = True
            else:
                new_pf_rules.append(rule)
        
        if modified:
            newRules = "\n".join(new_pf_rules)
            with open("/etc/pf.conf", "w") as pfconfFile:
                pfconfFile.write(newRules)

            subprocess.call(["pfctl", "-f", "/etc/pf.conf"])



def port_DROP(port, protocol):

    if os_detection.detect() == "Linux":
           
        try:
            if (protocol == "tcp"):
                check_iptables(port,protocol, "ACCEPT")
                check_iptables(port,protocol, "DROP")
                command = "/sbin/iptables -A OUTPUT -p tcp --dport {} -j DROP && /sbin/iptables -A INPUT -p tcp --dport {} -j DROP && /sbin/service iptables save".format(port, port)
                subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
                

            if (protocol == "udp"):
                check_iptables(port,protocol, "ACCEPT")
                check_iptables(port,protocol, "DROP")
                command = "/sbin/iptables -A OUTPUT -p udp --dport {} -j DROP && /sbin/iptables -A INPUT -p udp --dport {} -j DROP && /sbin/service iptables save".format(port, port)
                subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                


        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e.stderr))


    if os_detection.detect() == "Windows":
        try:
            if protocol == "tcp":
                check_iptables(port, protocol, "Allow")
                check_iptables(port, protocol, "Block")
                command = "New-NetFirewallRule -DisplayName \"Block Port {port}\" -Direction Inbound -Protocol TCP -Action Block -LocalPort {port}; New-NetFirewallRule -DisplayName \"Block Port {port}\" -Direction Outbound -Protocol TCP -Action Block -LocalPort {port}"
                subprocess.run(["powershell", "-Command", command], check=True)

            if protocol == "udp":
                check_iptables(port, protocol, "Allow")
                check_iptables(port, protocol, "Block")
                command = "New-NetFirewallRule -DisplayName \"Block Port {port}\" -Direction Inbound -Protocol TCP -Action Block -LocalPort {port}; New-NetFirewallRule -DisplayName \"Block Port {port}\" -Direction Outbound -Protocol TCP -Action Block -LocalPort {port}"
                subprocess.run(["powershell", "-Command", command], check=True)

        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e))

    if os_detection.detect() == "freebsd": #might be able to use for darwin as well
        try:
            check_iptables(port, protocol, "pass")
            check_iptables(port, protocol, "block")

            subprocess.run(["pfctl", "-e"], check=True)
            subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)

            subprocess.run(["pfctl", "-t", "blocked-ports", "-T", "add", "{}/{}".format(port, protocol)], check=True)
            subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)


        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e))


def port_ACCEPT(port, protocol):
    if os_detection.detect() == "Linux":

        try:
            if (protocol == "tcp"):
                check_iptables(port,protocol, "DROP")
                check_iptables(port,protocol, "ACCEPT")
                command = "/sbin/iptables -A OUTPUT -p tcp --dport {} -j ACCEPT && /sbin/iptables -A INPUT -p tcp --dport {} -j ACCEPT && /sbin/service iptables save".format(port, port)
                subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                

            if (protocol == "udp"):
                check_iptables(port,protocol, "DROP")
                check_iptables(port,protocol, "ACCEPT")
                command = "/sbin/iptables -A OUTPUT -p udp --dport {} -j ACCEPT && /sbin/iptables -A INPUT -p udp --dport {} -j ACCEPT && /sbin/service iptables save".format(port, port)
                subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e.stderr))


    if os_detection.detect() == "Windows":
        try:
            if protocol == "tcp":
                check_iptables(port, protocol, "Allow")
                check_iptables(port, protocol, "Block")
                command = "New-NetFirewallRule -DisplayName \"Allow Port {port}\" -Direction Inbound -Protocol TCP -Action Allow -LocalPort {port}; New-NetFirewallRule -DisplayName \"Allow Port {port}\" -Direction Outbound -Protocol TCP -Action Allow -LocalPort {port}"
                subprocess.run(["powershell", "-Command", command], check=True)

            if protocol == "udp":
                check_iptables(port, protocol, "Allow")
                check_iptables(port, protocol, "Block")
                command = "New-NetFirewallRule -DisplayName \"Allow Port {port}\" -Direction Inbound -Protocol TCP -Action Allow -LocalPort {port}; New-NetFirewallRule -DisplayName \"Allow Port {port}\" -Direction Outbound -Protocol TCP -Action Allow -LocalPort {port}"
                subprocess.run(["powershell", "-Command", command], check=True)

        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e))


    if os_detection.detect() == "freebsd": #might be able to use for darwin as well
        try:
            if (protocol == "tcp"):
                check_iptables(port, protocol, "pass")
                check_iptables(port, protocol, "block")

                subprocess.run(["pfctl", "-e"], check=True)
                subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)

                subprocess.run(["pfctl", "-a", "allow-ports", "-p", "tcp", "--dport",str(port), "-j", "pass"], check=True)
                subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)
            elif (protocol == "udp"):
                check_iptables(port, protocol, "pass")
                check_iptables(port, protocol, "block")

                subprocess.run(["pfctl", "-e"], check=True)
                subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)

                subprocess.run(["pfctl", "-a", "allow-ports", "-p", "udp", "--dport",str(port), "-j", "pass"], check=True)
                subprocess.run(["pfctl", "-f", "/etc/pf.conf"], check=True)
            
        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e))
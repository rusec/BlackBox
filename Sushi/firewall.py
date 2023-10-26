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





def port_DROP(port, protocol):

    if os_detection.detect() == "Linux":
           
            try:
                if (protocol == "tcp"):
                    check_iptables(port,protocol, "ACCEPT")
                    check_iptables(port,protocol, "DROP")
                    command = "/sbin/iptables -A OUTPUT -p tcp --dport {} -j DROP && /sbin/iptables -A INPUT -p tcp --dport {} -j DROP && /sbin/service iptables save".format(port, port)
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                
                    

                if (protocol == "udp"):
                    check_iptables(port,protocol, "ACCEPT")
                    check_iptables(port,protocol, "DROP")
                    command = "/sbin/iptables -A OUTPUT -p udp --dport {} -j DROP && /sbin/iptables -A INPUT -p udp --dport {} -j DROP && /sbin/service iptables save".format(port, port)
                    output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            except subprocess.CalledProcessError as e:
                print ("ERROR: {}".format(e.stderr))




def port_ACCEPT(port, protocol):
    if os_detection.detect() == "Linux":

        try:
            if (protocol == "tcp"):
                check_iptables(port,protocol, "DROP")
                check_iptables(port,protocol, "ACCEPT")
                command = "/sbin/iptables -A OUTPUT -p tcp --dport {} -j ACCEPT && /sbin/iptables -A INPUT -p tcp --dport {} -j ACCEPT && /sbin/service iptables save".format(port, port)
                output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                

            if (protocol == "udp"):
                check_iptables(port,protocol, "DROP")
                check_iptables(port,protocol, "ACCEPT")
                command = "/sbin/iptables -A OUTPUT -p udp --dport {} -j ACCEPT && /sbin/iptables -A INPUT -p udp --dport {} -j ACCEPT && /sbin/service iptables save".format(port, port)
                output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        except subprocess.CalledProcessError as e:
            print ("ERROR: {}".format(e.stderr))

import subprocess
import os_detection

# /sbin/iptables -A OUTPUT -p tcp --dport 25 -j DROP
# /sbin/service iptables save
def port_close(port):

    if os_detection.detect() == "Linux":
        try:
            command = "/sbin/iptables -A OUTPUT -p tcp,udp --dport {} -j DROP && /sbin/service iptables save".format(port)

            output = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            print (output)

        except subprocess.CalledProcessError as e:

            print ("ERROR: {}".format(e))

import os
import ctypes
import sys
import pyfiglet
import firewall
import details
import subprocess
from os_detection import detect



sushi_banner = pyfiglet.figlet_format("SUSHI")
print(sushi_banner)


#check privilege
if (detect() == "Linux" or detect() == "Freebsd" or detect() == "Darwin" or detect() == "Openbsd"):
    try:
        euid = os.geteuid()
        egid = os.getegid()

        if euid == 0 and egid == 0:
            print("SUSHI running with SUPERUSER privileges\n")
        else:
            print("SUSHI running with STANDARD USER privileges\nMay lack the proper permissions for some functions\n")

    except (OSError or AttributeError) as e:
        print("Error: {}".format(e))
elif (detect() == "Windows"):
    try:
        TOKEN_QUERY = 0x008
        TokenElevation = 20
        TokenElevationTypeDefault = 1
        TokenElevationTypeFull = 2
        TokenElevationTypeLimited = 3

        hProcessToken = ctypes.c_void_p()
        ctypes.wind11.kernel32.OpenProcessToken(ctypes.wind11.kernel32.GetCurrentProcess(),TOKEN_QUERY, ctypes.byref(hProcessToken))

        elevation_type = ctypes.c_ulong()
        ctypes.wind11.advapi32.GetTokenInformation(hProcessToken,TokenElevationTypeDefault, ctypes.byref(elevation_type), ctypes.sizeof(elevation_type))

        if elevation_type.value == TokenElevationTypeFull:
            print("SUSHI running with FULL ADMINISTRATOR privileges\n")
        elif elevation_type.value == TokenElevationTypeLimited:
            print("SUSHI running with LIMITED ADMINISTRATOR privileges\n")
        else:
            print("SUSHI running with STANDARD USER privileges\nMay lack the proper permissions for some functions\n")

    except (OSError or AttributeError) as e:
        print("Error: {}".format(e))

        
try:
    valid_input = 0
    while (valid_input == 0):
        mode = input("\nEnter 1 for Port Scanner or 2 for Port Resetter: ")
        if (mode == "1"):
            print("\nEntered Port Scanner")
            valid_input = 1
        elif (mode == "2"):
            print("\nEntered Port Resetter")
            valid_input = 2
        else:
            print("\"{}\" is not a valid input".format(mode))


    if (valid_input == 1):
        valid_ip = 0
        while (valid_ip == 0):    
            ip = input("\nEnter Target IP: ")
            try:    
                output = subprocess.check_output(["ping", ip, "-c", "4"]).decode("UTF-8")
                valid_ip = 1
            except subprocess.CalledProcessError as e:
                print("\nERROR: IP unreachable or invalid")
            

        valid_port = 0
        while (valid_port == 0):
            port = input("Enter Target Port: ")
            port = int(port)
            
            if (port >= 0 and port <= 65535):
                valid_port = 1

        details.scan(ip, port)

    elif (valid_input == 2):
        valid_type = 0
        while valid_type == 0:
            reset_type = int(input("[*] Enter 1 for port close [*] Enter 2 for port open [*] Enter 3 for port reset\nType: "))

            if reset_type == 1 or reset_type == 2 or reset_type == 3:
                valid_type = 1



        valid_port = 0
        while (valid_port == 0):
            port = input("Enter Target Port: ")
            port = int(port)
            
            if (port >= 0 and port <= 65535):
                valid_port = 1
                port = str(port)

        if (reset_type == 1):
            firewall.port_DROP(port, "tcp")
            firewall.port_DROP(port, "udp")

        elif (reset_type == 2):
            firewall.port_ACCEPT(port, "tcp")
            firewall.port_ACCEPT(port, "udp")

        elif (reset_type == 3):
            firewall.port_DROP(port, "tcp")
            firewall.port_DROP(port, "ucp")
            firewall.port_ACCEPT(port, "tcp")
            firewall.port_ACCEPT(port, "udp")
            

except KeyboardInterrupt:
    print ("\nKeyboard Interupt Detected: Quitting...")
    sys.exit()
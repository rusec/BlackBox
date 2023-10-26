import sys
import socket
from nmap import *


def port_info(ip,port):
    
    try:
        scanner = PortScanner()
        scanner.scan(ip, arguments='-p {} -A'.format(port))
        
        service_info = scanner[ip]['tcp'][port]
        
        list = ['name', 'product', 'version', 'extrainfo', 'cpe', 'conf']

        for element in list:
            if service_info[element] != "":
                print ("[*] {}: {}".format(element.upper(), service_info[element]))
    except KeyboardInterrupt:
        print ("\nKeyboard Interupt Detected: Quitting...")
        sys.exit()



def scan(ip, port):

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        socket.setdefaulttimeout(1)

        ip_addr = socket.gethostbyname(ip)
        r = s.connect_ex((ip, port))
        try:
            banner = s.recv(1024)
        except OSError or ArithmeticError:
            s.close()
        s.close()

        if r == 0:
            try:
                service_info = socket.getservbyport(port)
                print("IP: {}\tPORT: {}\tSTATE: open\t SERVICE: {}\n".format(ip_addr, port,service_info))
                
                if banner != "":
                    print ("[*] BANNER: {}".format(banner))

            except socket.error as e:
                print ("[*] BANNER: {}".format(banner))
                print ("\n Host is not responding: ", e)
                print (" Quitting...")
                s.close
                sys.exit()

        else:
            print ("*** Port {} is closed***".format(port))
        s.close()

    except KeyboardInterrupt:
        print ("\n Keyboard Interupt Detected: Quitting...")
        sys.exit()

    port_info(ip_addr,port)
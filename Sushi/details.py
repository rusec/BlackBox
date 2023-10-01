import sys
import socket
import nmap


def port_info(ip,port):
    
    scanner = nmap.PortScanner()
    scanner.scan(ip, arguments='-p {} -A'.format(port))

    service_info = scanner[ip]['tcp'][port]

    list = ['name', 'product', 'version', 'extrainfo', 'cpe', 'conf']

    for element in list:
        if service_info[element] != " ":
            print ("{}: {}".format(element, service_info[element]))





def scan(ip, port):

    try:

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        socket.setdefaulttimeout(1)

        r = s.connect_ex((ip, port))
        s.close()

        if r == 0:
            try:
                service_info = socket.getservbyport(port)
                print("PORT: {}\tSTATE: open\t SERVICE: {}\n".format(port,service_info))

            except socket.error as e:
                print ("\n Host is not responding: ", e)
                print (" Quitting...")
                s.close
                sys.exit()

        else:
            print ("** Port {} is closed".format(port))
        s.close()

    except KeyboardInterrupt:
        print ("\n Keyboard Interupt: Quitting...")
        sys.exit()

    port_info(ip,port)
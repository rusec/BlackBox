#!/usr/bin/env python3

from fabric import Connection
from invoke.exceptions import UnexpectedExit
from sys import argv
from os.path import exists
from os import mkdir
from shlex import quote as shquote

try:
    user = argv[1]
    hostname = argv[2]
    port = int(argv[3])
    inf = argv[4]
    filt = argv[5]
    tempdir = argv[6]
except (ValueError, IndexError):
    print(f'Usage: {argv[0]} <user> <hostname> <port> <interface> <filter> <tempdir>')
    print('    <user>:      Username to login as on the remote machine')
    print('    <hostname>:  Hostname of the remote machine')
    print('    <port>:      SSH port of the remote machine')
    print('    <interface>: Network interface to listen on on the remote machine')
    print('    <filter>:    Filter for tcpdump')
    print('    <tempdir>:   Temporary directory to store pcaps in on the remote machine')
    exit(1)

tempdir = tempdir.rstrip('/')

if not exists('/traffic'): mkdir('/traffic')

conn = Connection(hostname, port=port, user=user)
try: conn.run(f'mkdir -p {shquote(tempdir)}')
except UnexpectedExit: ...

transport = conn.transport
transport.set_keepalive(1)
channel = transport.open_session()
channel.get_pty()
try:
    cmdstat = channel.exec_command(f'tcpdump -i {shquote(inf)} -n -G 5 -w {shquote(tempdir)}/router-%H-%M-%S.pcap -z echo {filt}')
    capcom = channel.makefile()
    ecom = channel.makefile_stderr()
    while channel.active:
        nxf = capcom.readline().strip()
        if not nxf: continue
        if not nxf.endswith('.pcap'): continue
        if not nxf.startswith(tempdir): nxf = tempdir + '/' + nxf
        try:
            print(nxf)
            conn.get(nxf, '/traffic/')
            conn.run(f'rm {shquote(nxf)}')
        except UnexpectedExit as e:
            print(e, nxf)

    print(ecom.read())
except KeyboardInterrupt:
    channel.send(b'\x03')
    channel.close()

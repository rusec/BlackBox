#!/usr/bin/env python3

from fabric import Connection
from invoke.exceptions import UnexpectedExit
from sys import argv
from os.path import exists
from os import mkdir
import subprocess
from subprocess import check_output
from shlex import quote as shquote

hostname = argv[1]
port = int(argv[2])
inf = argv[3]
filt = argv[4]

if not exists('/traffic'): mkdir('/traffic')

conn = Connection(hostname, port=port)
try: conn.run('mkdir -p /tmp/pcaps')
except UnexpectedExit: ...
conn.put('postcap.bash', '/root/postcap.bash')

transport = conn.transport
transport.set_keepalive(1)
channel = transport.open_session()
channel.get_pty()
try:
    cmdstat = channel.exec_command(f'tcpdump -i {inf} -n -G 5 -w /tmp/pcaps/router-%H-%M-%S.pcap -z echo {filt}')
    capcom = channel.makefile()
    ecom = channel.makefile_stderr()
    while channel.active:
        nxf = capcom.readline().strip()
        if not nxf: continue
        if not nxf.endswith('.pcap'): continue
        if not nxf.startswith('/tmp/pcaps'): nxf = '/tmp/pcaps/' + nxf
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

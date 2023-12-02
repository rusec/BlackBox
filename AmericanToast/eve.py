#!/usr/bin/env python3

from fabric import Connection
from sys import argv
from os.path import exists
from os import mkdir
import subprocess
from subprocess import check_output

hostname = argv[1]
port = int(argv[2])
start = 1

if not exists('/traffic'): mkdir('/traffic')

if exists('/traffic/eve.json'):
    check_output(['sed', '$d', '/traffic/eve.json'])
    start = int(check_output(['wc', '-l', '/traffic/eve.json']).split()[0]) + 1

conn = Connection(hostname, port=port)
with open('/traffic/eve.json', 'a') as f:
    res = conn.run(f'tail -f -n +{start} /var/log/suricata/eve.json', out_stream=f)

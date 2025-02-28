#!/usr/bin/env python3

from fabric import Connection
from sys import argv
from os.path import exists
from os import mkdir
import subprocess
from subprocess import check_output

if len(argv) <= 3:
    print("Usage: eve.py <user> <hostname> <port> <suricata_dir>")
    exit(1)

user = argv[1]
hostname = argv[2]
port = int(argv[3])
suricata_dir = (argv[4]) if len(argv) > 4 else '/var/log/suricata/eve.json'
start = 1





if not exists('/traffic'): mkdir('/traffic')

if not suricata_dir:
    print(f"Suricata directory {suricata_dir} does not exist.")
    exit(1)

if exists('/traffic/eve.json'):
    check_output(['sed', '$d', '/traffic/eve.json'])
    start = int(check_output(['wc', '-l', '/traffic/eve.json']).split()[0]) + 1

conn = Connection(hostname, port=port, user=user)
with open('/traffic/eve.json', 'a') as f:
    res = conn.run(f'tail -f -n +{start} {suricata_dir}/eve.json', out_stream=f)

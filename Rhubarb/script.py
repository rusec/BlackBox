#!/usr/bin/env python3

import paramiko
import logging
import selectors
import threading
import os
import os.path
import io
import json
from json.decoder import JSONDecodeError
import time
from urllib.parse import quote as urlquote
from sys import argv
from getpass import getpass

debug = logging.debug
info = logging.info
error = logging.error

logging.basicConfig(level=logging.DEBUG)

if len(argv) != 2:
    error(f'USAGE: {argv[0]} <config filename without extension>')
    exit(1)

cfname = argv[1]

with open(f'{cfname}.json', 'r') as f:
    config = json.load(f)

if 'askpass' in config and config['askpass']:
    passphrase = getpass()

sel = selectors.DefaultSelector()
r, w = os.pipe()
sel.register(r, selectors.EVENT_READ, (io.FileIO(r, mode='r'), 'dummy-pipe', None))

def run_sel():
    global sel

    while len(sel.get_map()):
        events = sel.select()
        for key, mask in events:
            fo = key.fileobj
            f, lbl, ev = key.data
            dat = f.readline()
            if dat:
                dat = repr(dat.rstrip('\n'))
                info(f'{lbl}: {dat}')
            else:
                info(f'{lbl} closed')
                sel.unregister(fo)
                if ev is not None: ev.set()

handle = threading.Thread(target=run_sel)

handle.start()

clients = {}
transports = {}

for host, opts in config['hosts'].items():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        host,
        opts['port'] if 'port' in opts else 22,
        username=opts['user'] if 'user' in opts else 'root',
        disabled_algorithms=opts['disalgs'] if 'disalgs' in opts else None,
        passphrase=passphrase,
    )
    transport = client.get_transport()
    clients[host] = client
    transports[host] = transport

def run_command(host, com, lbl, event=None, pty=False):
    global sel, transports

    transport = transports[host]

    channel = transport.open_session()
    if pty: channel.get_pty()
    channel.set_combine_stderr(True)
    channel.exec_command(com)

    sel.register(channel, selectors.EVENT_READ, (channel.makefile(), lbl, event))

    return channel

sftps = {host: client.open_sftp() for host, client in clients.items()}

lrz_evs = []

for host, sftp in sftps.items():
    # sftp.mkdir('/tmp/wazuh')
    sftp.put('./lrzip', '/usr/local/bin/lrzip')
    sftp.put('./wazuh.tar.lrz', '/tmp/wazuh.tar.lrz')
    sftp.chmod('/usr/local/bin/lrzip', 0o755)
    ev = threading.Event()
    run_command(host, 'cd /tmp && lrzip -d wazuh.tar.lrz', f'{host}-lrz', ev)
    lrz_evs.append(ev)

for ev in lrz_evs: ev.wait()

tar_evs = []

for host in clients:
    ev = threading.Event()
    run_command(host, 'cd /tmp && tar xf wazuh.tar', f'{host}-tar', ev)
    tar_evs.append(ev)

for ev in tar_evs: ev.wait()

inst_evs = []

for host, sftp in sftps.items():
    sftp.put('./preloaded-vars.conf', '/tmp/wazuh-4.7.0/etc/preloaded-vars.conf')
    ev = threading.Event()
    run_command(host, 'cd /tmp/wazuh-4.7.0 && ./install.sh', f'{host}-install', ev)
    inst_evs.append(ev)

for ev in inst_evs: ev.wait()

start_evs = []

for host in clients:
    ev = threading.Event()
    run_command(host, 'systemctl start wazuh-agent', f'{host}-start', ev)
    start_evs.append(ev)

for ev in start_evs: ev.wait()

stat_evs = []

for host in clients:
    ev = threading.Event()
    run_command(host, 'systemctl status wazuh-agent', f'{host}-stat', ev)
    stat_evs.append(ev)

for ev in stat_evs: ev.wait()

'''
procs = []

while True:
    com = input().split()
    if len(com) < 1:
        opt = 'help'
    else:
        opt = com[0].lower()

    if opt == 'ls':
        for host in clients:
            lbl = f'{host}-uname'
            ev = threading.Event()
            chan = run_command(host, 'uname -a', lbl, ev, pty=True)
            procs.append((lbl, chan, ev))
    elif opt == 'quit' or opt == 'exit':
        for _, chan, _ in procs:
            try:
                chan.send('\3')
            except OSError: ...
        break
    elif opt != 'help':
        error('Unrecognized command')
        opt = 'help'

    if opt == 'help':
        info('COMMANDS: help - display this help')
        info('COMMANDS: ls - list currently running sync jobs')
        info('COMMANDS: quit|exit - stop everything and quit the program')
'''

os.close(w)
handle.join()

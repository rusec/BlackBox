#!/bin/bash

. /usr/sbin/so-common

usage() {
  read -r -d '' message <<- EOM
		usage: $0 [-h] NIC

    positional arguments:
      NIC           The interface to add to the monitor bond (ex: eth2)

    optional arguments:
      -h, --help    Show this help message and exit
	EOM
  echo "$message"
  exit 1
}

if [[ $# -eq 0 || $# -gt 1 ]] || [[ $1 == '-h' || $1 == '--help' ]]; then
  usage
fi

BNIC=$1
if [[ -z $MTU ]]; then
	MTU=$(lookup_pillar "mtu" "sensor")
fi
#echo "MTU: $MTU"
nic_error=0

# Check if specific offload features are able to be disabled
for string in "generic-segmentation-offload" "generic-receive-offload" "tcp-segmentation-offload"; do
	if ethtool -k "$BNIC" | grep $string | grep -q "on [fixed]"; then
		echo "The hardware or driver for interface ${BNIC} is not supported, packet capture may not work as expected."
		((nic_error++))
		break
	fi
done

for i in rx tx sg tso ufo gso gro lro; do
	ethtool -K "$BNIC" $i off
done
# Check if the bond slave connection has already been created
nmcli -f name,uuid -p con | grep -q "bond0-slave-$BNIC"
found_int=$?

if [[ $found_int != 0 ]]; then
	# Create the slave interface and assign it to the bond
	nmcli con add type vlan dev "$(echo "$BNIC" | sed -e 's/\..*$//')" id "$(echo "$BNIC" | sed -e 's/^.*\.//')" ifname "$BNIC" con-name "bond0-slave-$BNIC" master bond0 -- \
		connection.autoconnect "yes"
else
	int_uuid=$(nmcli -f name,uuid -p con | sed -n "s/bond0-slave-$BNIC //p" | tr -d ' ')

	nmcli con mod "$int_uuid" \
		connection.autoconnect "yes"
fi

ip link set dev "$BNIC" arp off multicast off allmulticast off promisc on
		
# Bring the slave interface up
nmcli con up "bond0-slave-$BNIC"
 
if [ "$nic_error" != 0 ]; then
	return "$nic_error"
fi

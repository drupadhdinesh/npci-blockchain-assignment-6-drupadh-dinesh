#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0




# default to using Airtel
ORG=${1:-Airtel}

# Exit on first error, print all commands.
set -e
set -o pipefail

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

ORDERER_CA=${DIR}/test-network/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
PEER0_Airtel_CA=${DIR}/test-network/organizations/peerOrganizations/Airtel.example.com/tlsca/tlsca.Airtel.example.com-cert.pem
PEER0_Jio_CA=${DIR}/test-network/organizations/peerOrganizations/Jio.example.com/tlsca/tlsca.Jio.example.com-cert.pem
PEER0_ORG3_CA=${DIR}/test-network/organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem


if [[ ${ORG,,} == "Airtel" || ${ORG,,} == "digibank" ]]; then

   CORE_PEER_LOCALMSPID=AirtelMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/test-network/organizations/peerOrganizations/Airtel.example.com/users/Admin@Airtel.example.com/msp
   CORE_PEER_ADDRESS=localhost:7051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/test-network/organizations/peerOrganizations/Airtel.example.com/tlsca/tlsca.Airtel.example.com-cert.pem

elif [[ ${ORG,,} == "Jio" || ${ORG,,} == "magnetocorp" ]]; then

   CORE_PEER_LOCALMSPID=JioMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/test-network/organizations/peerOrganizations/Jio.example.com/users/Admin@Jio.example.com/msp
   CORE_PEER_ADDRESS=localhost:9051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/test-network/organizations/peerOrganizations/Jio.example.com/tlsca/tlsca.Jio.example.com-cert.pem

else
   echo "Unknown \"$ORG\", please choose Airtel/Digibank or Jio/Magnetocorp"
   echo "For example to get the environment variables to set upa Jio shell environment run:  ./setOrgEnv.sh Jio"
   echo
   echo "This can be automated to set them as well with:"
   echo
   echo 'export $(./setOrgEnv.sh Jio | xargs)'
   exit 1
fi

# output the variables that need to be set
echo "CORE_PEER_TLS_ENABLED=true"
echo "ORDERER_CA=${ORDERER_CA}"
echo "PEER0_Airtel_CA=${PEER0_Airtel_CA}"
echo "PEER0_Jio_CA=${PEER0_Jio_CA}"
echo "PEER0_ORG3_CA=${PEER0_ORG3_CA}"

echo "CORE_PEER_MSPCONFIGPATH=${CORE_PEER_MSPCONFIGPATH}"
echo "CORE_PEER_ADDRESS=${CORE_PEER_ADDRESS}"
echo "CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE}"

echo "CORE_PEER_LOCALMSPID=${CORE_PEER_LOCALMSPID}"

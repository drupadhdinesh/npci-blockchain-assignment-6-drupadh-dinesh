#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
# test network home var targets to test-network folder
# the reason we use a var here is to accommodate scenarios
# where execution occurs from folders outside of default as $PWD, such as the test-network/addOrg3 folder.
# For setting environment variables, simple relative paths like ".." could lead to unintended references
# due to how they interact with FABRIC_CFG_PATH. It's advised to specify paths more explicitly,
# such as using "../${PWD}", to ensure that Fabric's environment variables are pointing to the correct paths.
TEST_NETWORK_HOME=${TEST_NETWORK_HOME:-${PWD}}
. ${TEST_NETWORK_HOME}/scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_Airtel_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Airtel.example.com/tlsca/tlsca.Airtel.example.com-cert.pem
export PEER0_Jio_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Jio.example.com/tlsca/tlsca.Jio.example.com-cert.pem
export PEER0_ORG3_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  infoln "Using organization ${USING_ORG}"
  if [ $USING_ORG -eq 1 ]; then
    export CORE_PEER_LOCALMSPID=AirtelMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_Airtel_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Airtel.example.com/users/Admin@Airtel.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ $USING_ORG -eq 2 ]; then
    export CORE_PEER_LOCALMSPID=JioMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_Jio_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Jio.example.com/users/Admin@Jio.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID=Org3MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
  else
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" = "true" ]; then
    env | grep CORE
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  
  while [ "$#" -gt 0 ]; do
    setGlobals "$1"

    # Set peer and CA values based on argument
    if [ "$1" == "1" ]; then
      PEER="peer0.Airtel"
      CA="PEER0_Airtel_CA"
    elif [ "$1" == "2" ]; then
      PEER="peer0.Jio"
      CA="PEER0_Jio_CA"
    else
      PEER="peer0.org$1"
      CA="PEER0_ORG$1_CA"
    fi

    # Add peer to PEERS list
    if [ -z "$PEERS" ]; then
      PEERS="$PEER"
    else
      PEERS="$PEERS $PEER"
    fi

    # Set peer address parameters
    PEER_CONN_PARMS+=("--peerAddresses" "$CORE_PEER_ADDRESS")

    # Set TLS certificate
    TLSINFO=(--tlsRootCertFiles "${!CA}")
    PEER_CONN_PARMS+=("${TLSINFO[@]}")

    # Move to the next argument
    shift
  done
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}

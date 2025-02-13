#!/usr/bin/env bash

#
# SPDX-License-Identifier: Apache-2.0
#

${AS_LOCAL_HOST:=true}

: "${TEST_NETWORK_HOME:=../..}"
: "${CONNECTION_PROFILE_FILE_Airtel:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Airtel.example.com/connection-Airtel.json}"
: "${CERTIFICATE_FILE_Airtel:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Airtel.example.com/users/User1@Airtel.example.com/msp/signcerts/User1@Airtel.example.com-cert.pem}"
: "${PRIVATE_KEY_FILE_Airtel:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Airtel.example.com/users/User1@Airtel.example.com/msp/keystore/priv_sk}"

: "${CONNECTION_PROFILE_FILE_Jio:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Jio.example.com/connection-Jio.json}"
: "${CERTIFICATE_FILE_Jio:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Jio.example.com/users/User1@Jio.example.com/msp/signcerts/User1@Jio.example.com-cert.pem}"
: "${PRIVATE_KEY_FILE_Jio:=${TEST_NETWORK_HOME}/organizations/peerOrganizations/Jio.example.com/users/User1@Jio.example.com/msp/keystore/priv_sk}"


cat << ENV_END > .env
# Generated .env file
# See src/config.ts for details of all the available configuration variables
#

LOG_LEVEL=info

PORT=3000

HLF_CERTIFICATE_Airtel="$(cat ${CERTIFICATE_FILE_Airtel} | sed -e 's/$/\\n/' | tr -d '\r\n')"

HLF_PRIVATE_KEY_Airtel="$(cat ${PRIVATE_KEY_FILE_Airtel} | sed -e 's/$/\\n/' | tr -d '\r\n')"

HLF_CERTIFICATE_Jio="$(cat ${CERTIFICATE_FILE_Jio} | sed -e 's/$/\\n/' | tr -d '\r\n')"

HLF_PRIVATE_KEY_Jio="$(cat ${PRIVATE_KEY_FILE_Jio} | sed -e 's/$/\\n/' | tr -d '\r\n')"

REDIS_PORT=6379

Airtel_APIKEY=$(uuidgen)

Jio_APIKEY=$(uuidgen)

ENV_END
 
if [ "${AS_LOCAL_HOST}" = "true" ]; then

cat << LOCAL_HOST_END >> .env
AS_LOCAL_HOST=true

HLF_CONNECTION_PROFILE_Airtel=$(cat ${CONNECTION_PROFILE_FILE_Airtel} | jq -c .)

HLF_CONNECTION_PROFILE_Jio=$(cat ${CONNECTION_PROFILE_FILE_Jio} | jq -c .)

REDIS_HOST=localhost

LOCAL_HOST_END

elif [ "${AS_LOCAL_HOST}" = "false" ]; then

cat << WITH_HOSTNAME_END >> .env
AS_LOCAL_HOST=false

HLF_CONNECTION_PROFILE_Airtel=$(cat ${CONNECTION_PROFILE_FILE_Airtel} | jq -c '.peers["peer0.Airtel.example.com"].url = "grpcs://peer0.Airtel.example.com:7051" | .certificateAuthorities["ca.Airtel.example.com"].url = "https://ca.Airtel.example.com:7054"')

HLF_CONNECTION_PROFILE_Jio=$(cat ${CONNECTION_PROFILE_FILE_Jio} | jq -c '.peers["peer0.Jio.example.com"].url = "grpcs://peer0.Jio.example.com:9051" | .certificateAuthorities["ca.Jio.example.com"].url = "https://ca.Jio.example.com:8054"')

REDIS_HOST=redis

WITH_HOSTNAME_END

fi

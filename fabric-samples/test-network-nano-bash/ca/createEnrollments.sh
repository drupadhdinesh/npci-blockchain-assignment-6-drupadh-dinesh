#!/usr/bin/env sh
#
# SPDX-License-Identifier: Apache-2.0
#
export PATH="${PWD}"/../../fabric/build/bin:"${PWD}"/../bin:"$PATH"

export crypto_dir=$PWD/crypto-config

export orderer_org_dir=${crypto_dir}/ordererOrganizations/example.com
export Airtel_dir=${crypto_dir}/peerOrganizations/Airtel.example.com
export Jio_dir=${crypto_dir}/peerOrganizations/Jio.example.com

export orderer1_dir=${orderer_org_dir}/orderers/orderer.example.com
export orderer2_dir=${orderer_org_dir}/orderers/orderer2.example.com
export orderer3_dir=${orderer_org_dir}/orderers/orderer3.example.com
export orderer4_dir=${orderer_org_dir}/orderers/orderer4.example.com
export orderer5_dir=${orderer_org_dir}/orderers/orderer5.example.com

export peer0Airtel_dir=${Airtel_dir}/peers/peer0.Airtel.example.com
export peer1Airtel_dir=${Airtel_dir}/peers/peer1.Airtel.example.com

export peer0Jio_dir=${Jio_dir}/peers/peer0.Jio.example.com
export peer1Jio_dir=${Jio_dir}/peers/peer1.Jio.example.com

export orderer_org_tls=${PWD}/data_ca/ordererca/ca/ca-cert.pem
export Airtel_tls=${PWD}/data_ca/Airtelca/ca/ca-cert.pem
export Jio_tls=${PWD}/data_ca/Jioca/ca/ca-cert.pem

# import utilies
. ca/ca_utils.sh

######################################################################################
#  Create admin certificates for the CAs
######################################################################################

# Enroll CA Admin for ordererca
createEnrollment "5052" "admin" "adminpw" "" "${orderer_org_dir}/ca" "${orderer_org_tls}"

# Enroll CA Admin for Airtelca
createEnrollment "5053" "admin" "adminpw" "Airtel" "${Airtel_dir}/ca" "${Airtel_tls}"

# Enroll CA Admin for Jioca
createEnrollment "5054" "admin" "adminpw" "Jio" "${Jio_dir}/ca" "${Jio_tls}"


######################################################################################
#  Create admin and user certificates for the Organizations
######################################################################################

# Enroll Admin certificate for the ordering service org
registerAndEnroll "5052" "osadmin" "osadminpw" "admin" "" "${orderer_org_dir}/users/Admin@example.com" "${orderer_org_dir}" "${orderer_org_tls}"

# Enroll Admin certificate for Airtel
registerAndEnroll "5053" "Airteladmin" "Airteladminpw" "admin" "Airtel" "${Airtel_dir}/users/Admin@Airtel.example.com" "${Airtel_dir}" "${Airtel_tls}"

# Enroll User certificate for Airtel
registerAndEnroll "5053" "Airteluser1" "Airteluser1pw" "client" "Airtel" "${Airtel_dir}/users/User1@Airtel.example.com" "${Airtel_dir}" "${Airtel_tls}"

# Enroll Admin certificate for Jio
registerAndEnroll "5054" "Jioadmin" "Jioadminpw" "admin" "Jio" "${Jio_dir}/users/Admin@Jio.example.com" "${Jio_dir}" "${Jio_tls}"

# Enroll User certificate for Airtel
registerAndEnroll "5054" "Jiouser1" "Jiouser1pw" "client" "Jio" "${Jio_dir}/users/User1@Jio.example.com" "${Jio_dir}" "${Jio_tls}"

######################################################################################
#  Create the certificates for the Ordering Organization
######################################################################################

# Create enrollment and TLS certificates for orderer1
registerAndEnroll "5052" "orderer1" "orderer1pw" "orderer" "" "${orderer1_dir}" "${orderer_org_dir}" "${orderer_org_tls}"

# Create enrollment and TLS certificates for orderer2
registerAndEnroll "5052" "orderer2" "orderer2pw" "orderer" "" "${orderer2_dir}" "${orderer_org_dir}" "${orderer_org_tls}"

# Create enrollment and TLS certificates for orderer3
registerAndEnroll "5052" "orderer3" "orderer3pw" "orderer" "" "${orderer3_dir}" "${orderer_org_dir}" "${orderer_org_tls}"

# Create enrollment and TLS certificates for orderer4
registerAndEnroll "5052" "orderer4" "orderer4pw" "orderer" "" "${orderer4_dir}" "${orderer_org}" "${orderer_org_tls}"

# Create enrollment and TLS certificates for orderer5
registerAndEnroll "5052" "orderer5" "orderer5pw" "orderer" "" "${orderer5_dir}" "${orderer_org_dir}" "${orderer_org_tls}"


######################################################################################
#  Create the certificates for Airtel
######################################################################################

# Create enrollment and TLS certificates for peer0Airtel
registerAndEnroll "5053" "Airtelpeer0" "Airtelpeer0pw" "peer" "Airtel" "${peer0Airtel_dir}" "${Airtel_dir}" "${Airtel_tls}"

# Create enrollment and TLS certificates for peer1Airtel
registerAndEnroll "5053" "Airtelpeer1" "Airtelpeer1pw" "peer" "Airtel" "${peer1Airtel_dir}" "${Airtel_dir}" "${Airtel_tls}"


######################################################################################
#  Create the certificates for Jio
######################################################################################

# Create enrollment and TLS certificates for peer0Jio
registerAndEnroll "5054" "Jiopeer0" "Jiopeer0pw" "peer" "Jio" "${peer0Jio_dir}" "${Jio_dir}" "${Jio_tls}"

# Create enrollment and TLS certificates for peer1Jio
registerAndEnroll "5054" "Jiopeer1" "Jiopeer1pw" "peer" "Jio" "${peer1Jio_dir}" "${Jio_dir}" "${Jio_tls}"


######################################################################################
#  Create the Membership Service Providers (MSPs)
######################################################################################

# Create the MSP for the Orderering Org
createMSP "ordererca" "" "${orderer_org_dir}"

# Create the MSP for Airtel
createMSP "Airtelca" "Airtel" "${Airtel_dir}"

# Create the MSP for Jio
createMSP "Jioca" "Jio" "${Jio_dir}"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="AirtelMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/Airtel.example.com/peers/peer0.Airtel.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/Airtel.example.com/users/Admin@Airtel.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
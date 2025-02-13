export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="JioMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/Jio.example.com/peers/peer0.Jio.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/Jio.example.com/users/Admin@Jio.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
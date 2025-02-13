package main

import (
	"fmt"
	"rest-api-go/web"
)

func main() {
	//Initialize setup for Airtel
	cryptoPath := "../../test-network/organizations/peerOrganizations/Airtel.example.com"
	orgConfig := web.OrgSetup{
		OrgName:      "Airtel",
		MSPID:        "AirtelMSP",
		CertPath:     cryptoPath + "/users/User1@Airtel.example.com/msp/signcerts/cert.pem",
		KeyPath:      cryptoPath + "/users/User1@Airtel.example.com/msp/keystore/",
		TLSCertPath:  cryptoPath + "/peers/peer0.Airtel.example.com/tls/ca.crt",
		PeerEndpoint: "dns:///localhost:7051",
		GatewayPeer:  "peer0.Airtel.example.com",
	}

	orgSetup, err := web.Initialize(orgConfig)
	if err != nil {
		fmt.Println("Error initializing setup for Airtel: ", err)
	}
	web.Serve(web.OrgSetup(*orgSetup))
}

/*
Copyright 2024 IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/hash"
	"github.com/hyperledger/fabric-protos-go-apiv2/gateway"
	"google.golang.org/grpc/status"
)

type transient = map[string][]byte

const (
	channelName   = "mychannel"
	chaincodeName = "private"
	mspIDAirtel   = "AirtelMSP"
	mspIDJio      = "JioMSP"

	// Collection names.
	AirtelPrivateCollectionName = "AirtelMSPPrivateCollection"
	JioPrivateCollectionName    = "JioMSPPrivateCollection"

	Red   = "\033[31m"
	Reset = "\033[0m"
)

// Use a unique key so that we can run multiple times.
var now = time.Now()
var assetID1 = fmt.Sprintf("asset%d", now.Unix())
var assetID2 = fmt.Sprintf("asset%d", now.Unix()+1)

func main() {
	clientAirtel := newGrpcConnection(
		tlsCertPathAirtel,
		peerEndpointAirtel,
		peerNameAirtel,
	)
	defer clientAirtel.Close()

	gatewayAirtel, err := client.Connect(
		newIdentity(certDirectoryPathAirtel, mspIDAirtel),
		client.WithSign(newSign(keyDirectoryPathAirtel)),
		client.WithClientConnection(clientAirtel),
		client.WithHash(hash.SHA256),
	)
	if err != nil {
		panic(err)
	}
	defer gatewayAirtel.Close()

	clientJio := newGrpcConnection(
		tlsCertPathJio,
		peerEndpointJio,
		peerNameJio,
	)
	defer clientJio.Close()

	gatewayJio, err := client.Connect(
		newIdentity(certDirectoryPathJio, mspIDJio),
		client.WithSign(newSign(keyDirectoryPathJio)),
		client.WithClientConnection(clientJio),
		client.WithHash(hash.SHA256),
	)
	if err != nil {
		panic(err)
	}
	defer gatewayJio.Close()

	// Get the smart contract as an Airtel client.
	contractAirtel := gatewayAirtel.GetNetwork(channelName).GetContract(chaincodeName)

	// Get the smart contract as an Airtel client.
	contractJio := gatewayJio.GetNetwork(channelName).GetContract(chaincodeName)

	fmt.Println("~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~")

	// Create new assets on the ledger.
	createAssets(contractAirtel)

	// Read asset from the Airtel's private data collection with ID in the given range.
	getAssetByRange(contractAirtel)

	// Attempt to transfer asset without prior approval from Jio, transaction expected to fail.
	fmt.Println("\nAttempt TransferAsset without prior AgreeToTransfer")
	err = transferAsset(contractAirtel, assetID1)
	if err == nil {
		doFail("TransferAsset transaction succeeded when it was expected to fail")
	}
	fmt.Printf("*** Received expected error: %+v\n", errorWithDetails(err))

	fmt.Println("\n~~~~~~~~~~~~~~~~ As Jio Client ~~~~~~~~~~~~~~~~")

	// Read the asset by ID.
	readAssetByID(contractJio, assetID1)

	// Make agreement to transfer the asset from Airtel to Jio.
	agreeToTransfer(contractJio, assetID1)

	fmt.Println("\n~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~")

	// Read transfer agreement.
	readTransferAgreement(contractAirtel, assetID1)

	// Transfer asset to Jio.
	if err := transferAsset(contractAirtel, assetID1); err != nil {
		doFail(fmt.Sprintf("TransferAsset transaction failed when it was expected to succeed: %+v\n", errorWithDetails(err)))
	}

	// Again ReadAsset: results will show that the buyer identity now owns the asset.
	readAssetByID(contractAirtel, assetID1)

	// Confirm that transfer removed the private details from the Airtel collection.
	AirtelReadSuccess := readAssetPrivateDetails(contractAirtel, assetID1, AirtelPrivateCollectionName)
	if AirtelReadSuccess {
		doFail(fmt.Sprintf("Asset private data still exists in %s", AirtelPrivateCollectionName))
	}

	fmt.Println("\n~~~~~~~~~~~~~~~~ As Jio Client ~~~~~~~~~~~~~~~~")

	// Jio can read asset private details: Jio is owner, and private details exist in new owner's Collection.
	JioReadSuccess := readAssetPrivateDetails(contractJio, assetID1, JioPrivateCollectionName)
	if !JioReadSuccess {
		doFail(fmt.Sprintf("Asset private data not found in %s", JioPrivateCollectionName))
	}

	fmt.Println("\nAttempt DeleteAsset using non-owner organization")
	err = deleteAsset(contractJio, assetID2)
	if err == nil {
		doFail("DeleteAsset transaction succeeded when it was expected to fail")
	}
	fmt.Printf("*** Received expected error: %+v\n", errorWithDetails(err))

	fmt.Println("\n~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~")

	// Delete AssetID2 as Airtel.
	if err := deleteAsset(contractAirtel, assetID2); err != nil {
		doFail(fmt.Sprintf("DeleteAsset transaction failed when it was expected to succeed: %+v\n", errorWithDetails(err)))
	}

	// Trigger a purge of the private data for the asset.
	// The previous delete is optional if purge is used.
	if err := purgeAsset(contractAirtel, assetID2); err != nil {
		doFail(fmt.Sprintf("PurgeAsset transaction failed when it was expected to succeed: %+v\n", errorWithDetails(err)))
	}
}

func createAssets(contract *client.Contract) {
	assetType := "ValuableAsset"

	fmt.Printf("\n--> Submit Transaction: CreateAsset, ID: %s\n", assetID1)

	type assetTransientInput struct {
		ObjectType     string
		AssetID        string
		Color          string
		Size           uint8
		AppraisedValue uint16
	}

	asset1Data := assetTransientInput{
		ObjectType:     assetType,
		AssetID:        assetID1,
		Color:          "green",
		Size:           20,
		AppraisedValue: 100,
	}

	if _, err := contract.Submit(
		"CreateAsset",
		client.WithTransient(transient{
			"asset_properties": marshal(asset1Data),
		}),
	); err != nil {
		panic(err)
	}

	logTxCommitSuccess()
	fmt.Printf("\n--> Submit Transaction: CreateAsset, ID: %s\n", assetID2)

	asset2Data := assetTransientInput{
		ObjectType:     assetType,
		AssetID:        assetID2,
		Color:          "blue",
		Size:           35,
		AppraisedValue: 727,
	}

	if _, err := contract.Submit(
		"CreateAsset",
		client.WithTransient(transient{
			"asset_properties": marshal(asset2Data),
		}),
	); err != nil {
		panic(err)
	}

	logTxCommitSuccess()
}

func getAssetByRange(contract *client.Contract) {
	// GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive).
	fmt.Printf("\n--> Evaluate Transaction: GetAssetByRange from %s\n", AirtelPrivateCollectionName)

	resultBytes, err := contract.EvaluateTransaction("GetAssetByRange", assetID1, fmt.Sprintf("asset%d", now.Unix()+2))
	if err != nil {
		panic(err)
	}

	if len(resultBytes) == 0 {
		doFail("Received empty query list for GetAssetByRange")
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
}

func readAssetByID(contract *client.Contract, assetID string) {
	fmt.Printf("\n--> Evaluate Transaction: ReadAsset, ID: %s\n", assetID)

	resultBytes, err := contract.EvaluateTransaction("ReadAsset", assetID)
	if err != nil {
		panic(err)
	}

	if len(resultBytes) == 0 {
		doFail("Received empty result for ReadAsset")
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
}

func agreeToTransfer(contract *client.Contract, assetID string) {
	// Buyer from Jio agrees to buy the asset.
	// To purchase the asset, the buyer needs to agree to the same value as the asset owner.
	dataForAgreement := struct {
		AssetID        string `json:"assetID"`
		AppraisedValue int    `json:"appraisedValue"`
	}{assetID, 100}
	fmt.Printf("\n--> Submit Transaction: AgreeToTransfer, payload: %+v\n", dataForAgreement)

	if _, err := contract.Submit(
		"AgreeToTransfer",
		client.WithTransient(transient{
			"asset_value": marshal(dataForAgreement),
		}),
	); err != nil {
		panic(err)
	}

	logTxCommitSuccess()
}

func readTransferAgreement(contract *client.Contract, assetID string) {
	fmt.Printf("\n--> Evaluate Transaction: ReadTransferAgreement, ID: %s\n", assetID)

	resultBytes, err := contract.EvaluateTransaction("ReadTransferAgreement", assetID)
	if err != nil {
		panic(err)
	}

	if len(resultBytes) == 0 {
		doFail("Received empty result for ReadTransferAgreement")
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))
}

func transferAsset(contract *client.Contract, assetID string) (err error) {
	fmt.Printf("\n--> Submit Transaction: TransferAsset, ID: %s\n", assetID)

	buyerDetails := struct {
		AssetID  string `json:"assetID"`
		BuyerMSP string `json:"buyerMSP"`
	}{assetID, mspIDJio}

	if _, err = contract.Submit(
		"TransferAsset",
		client.WithTransient(transient{
			"asset_owner": marshal(buyerDetails),
		}),
	); err != nil {
		return
	}

	logTxCommitSuccess()
	return
}

func deleteAsset(contract *client.Contract, assetID string) (err error) {
	fmt.Printf("\n--> Submit Transaction: DeleteAsset, ID: %s\n", assetID)

	dataForDelete := struct{ AssetID string }{assetID}

	if _, err = contract.Submit(
		"DeleteAsset",
		client.WithTransient(transient{
			"asset_delete": marshal(dataForDelete),
		}),
	); err != nil {
		return
	}

	logTxCommitSuccess()
	return
}

func purgeAsset(contract *client.Contract, assetID string) (err error) {
	fmt.Printf("\n--> Submit Transaction: PurgeAsset, ID: %s\n", assetID)

	dataForPurge := struct{ AssetID string }{assetID}

	if _, err = contract.Submit(
		"PurgeAsset",
		client.WithTransient(transient{
			"asset_purge": marshal(dataForPurge),
		}),
	); err != nil {
		return
	}

	logTxCommitSuccess()
	return
}

func readAssetPrivateDetails(contract *client.Contract, assetID, collectionName string) bool {
	fmt.Printf("\n--> Evaluate Transaction: ReadAssetPrivateDetails from %s, ID: %s\n", collectionName, assetID)

	resultBytes, err := contract.EvaluateTransaction("ReadAssetPrivateDetails", collectionName, assetID)
	if err != nil {
		panic(err)
	}

	if len(resultBytes) == 0 {
		fmt.Println("*** No result")
		return false
	}

	fmt.Printf("*** Result: %s\n", formatJSON(resultBytes))

	return true
}

func marshal(value any) []byte {
	valueAsBytes, err := json.Marshal(&value)
	if err != nil {
		panic(err)
	}

	return valueAsBytes
}

func logTxCommitSuccess() {
	fmt.Println("*** Transaction committed successfully")
}

func doFail(msg string) {
	fmt.Println(Red + msg + Reset)
	panic(errors.New(msg))
}

func formatJSON(data []byte) string {
	var result bytes.Buffer
	if err := json.Indent(&result, data, "", "  "); err != nil {
		panic(fmt.Errorf("failed to parse JSON: %w", err))
	}
	return result.String()
}

func errorWithDetails(err error) error {
	var buf strings.Builder

	statusErr := status.Convert(err)
	errDetails := statusErr.Details()
	if len(errDetails) > 0 {
		buf.WriteString("\nError Details:")

		for _, errDetail := range errDetails {
			if detail, ok := errDetail.(*gateway.ErrorDetail); ok {
				buf.WriteString(fmt.Sprintf("\n- address: %s", detail.GetAddress()))
				buf.WriteString(fmt.Sprintf("\n- mspID: %s", detail.GetMspId()))
				buf.WriteString(fmt.Sprintf("\n- message: %s\n", detail.GetMessage()))
			}
		}
	}

	return fmt.Errorf("%w%s", err, buf.String())
}

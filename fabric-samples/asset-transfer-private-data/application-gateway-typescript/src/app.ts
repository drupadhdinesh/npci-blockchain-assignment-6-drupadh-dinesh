/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { connect, Contract, hash } from '@hyperledger/fabric-gateway';
import { TextDecoder } from 'util';
import {
    certDirectoryPathAirtel, certDirectoryPathJio, keyDirectoryPathAirtel, keyDirectoryPathJio, newGrpcConnection, newIdentity,
    newSigner, peerEndpointAirtel, peerEndpointJio, peerNameAirtel, peerNameJio, tlsCertPathAirtel, tlsCertPathJio
} from './connect';

const channelName = 'mychannel';
const chaincodeName = 'private';
const mspIdAirtel = 'AirtelMSP';
const mspIdJio = 'JioMSP';

const utf8Decoder = new TextDecoder();

// Collection names.
const AirtelPrivateCollectionName = 'AirtelMSPPrivateCollection';
const JioPrivateCollectionName = 'JioMSPPrivateCollection';

const RED = '\x1b[31m\n';
const RESET = '\x1b[0m';

// Use a unique key so that we can run multiple times.
const now = Date.now();
const assetID1 = `asset${String(now)}`;
const assetID2 = `asset${String(now + 1)}`;

async function main(): Promise<void> {
    const clientAirtel = await newGrpcConnection(
        tlsCertPathAirtel,
        peerEndpointAirtel,
        peerNameAirtel
    );

    const gatewayAirtel = connect({
        client: clientAirtel,
        identity: await newIdentity(certDirectoryPathAirtel, mspIdAirtel),
        signer: await newSigner(keyDirectoryPathAirtel),
        hash: hash.sha256,
    });

    const clientJio = await newGrpcConnection(
        tlsCertPathJio,
        peerEndpointJio,
        peerNameJio
    );

    const gatewayJio = connect({
        client: clientJio,
        identity: await newIdentity(certDirectoryPathJio, mspIdJio),
        signer: await newSigner(keyDirectoryPathJio),
        hash: hash.sha256,
    });

    try {
        // Get the smart contract as an Airtel client.
        const contractAirtel = gatewayAirtel
            .getNetwork(channelName)
            .getContract(chaincodeName);

        // Get the smart contract as an Jio client.
        const contractJio = gatewayJio
            .getNetwork(channelName)
            .getContract(chaincodeName);

        console.log('\n~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~');

        // Create new assets on the ledger.
        await createAssets(contractAirtel);

        // Read asset from the Airtel's private data collection with ID in the given range.
        await getAssetByRange(contractAirtel);

        try {
            // Attempt to transfer asset without prior approval from Jio, transaction expected to fail.
            console.log('\nAttempt TransferAsset without prior AgreeToTransfer');
            await transferAsset(contractAirtel, assetID1);
            doFail('TransferAsset transaction succeeded when it was expected to fail');
        } catch (e) {
            console.log('*** Received expected error:', e);
        }

        console.log('\n~~~~~~~~~~~~~~~~ As Jio Client ~~~~~~~~~~~~~~~~');

        // Read the asset by ID.
        await readAssetByID(contractJio, assetID1);

        // Make agreement to transfer the asset from Airtel to Jio.
        await agreeToTransfer(contractJio, assetID1);

        console.log('\n~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~');

        // Read transfer agreement.
        await readTransferAgreement(contractAirtel, assetID1);

        // Transfer asset to Jio.
        await transferAsset(contractAirtel, assetID1);

        // Again ReadAsset: results will show that the buyer identity now owns the asset.
        await readAssetByID(contractAirtel, assetID1);

        // Confirm that transfer removed the private details from the Airtel collection.
        const AirtelReadSuccess = await readAssetPrivateDetails(contractAirtel, assetID1, AirtelPrivateCollectionName);
        if (AirtelReadSuccess) {
            doFail(`Asset private data still exists in ${AirtelPrivateCollectionName}`);
        }

        console.log('\n~~~~~~~~~~~~~~~~ As Jio Client ~~~~~~~~~~~~~~~~');

        // Jio can read asset private details: Jio is owner, and private details exist in new owner's collection.
        const JioReadSuccess = await readAssetPrivateDetails(contractJio, assetID1, JioPrivateCollectionName);
        if (!JioReadSuccess) {
            doFail(`Asset private data not found in ${JioPrivateCollectionName}`);
        }

        try {
            console.log('\nAttempt DeleteAsset using non-owner organization');
            await deleteAsset(contractJio, assetID2);
            doFail('DeleteAsset transaction succeeded when it was expected to fail');
        } catch (e) {
            console.log('*** Received expected error:', e);
        }

        console.log('\n~~~~~~~~~~~~~~~~ As Airtel Client ~~~~~~~~~~~~~~~~');

        // Delete AssetID2 as Airtel.
        await deleteAsset(contractAirtel, assetID2);

        // Trigger a purge of the private data for the asset.
        // The previous delete is optional if purge is used.
        await purgeAsset(contractAirtel, assetID2);
    } finally {
        gatewayAirtel.close();
        clientAirtel.close();

        gatewayJio.close();
        clientJio.close();
    }
}

main().catch((error: unknown) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAssets(contract: Contract): Promise<void> {
    const assetType = 'ValuableAsset';

    console.log(`\n--> Submit Transaction: CreateAsset, ID: ${assetID1}`);

    const asset1Data = {
        objectType: assetType,
        assetID: assetID1,
        color: 'green',
        size: 20,
        appraisedValue: 100,
    };

    await contract.submit('CreateAsset', {
        transientData: { asset_properties: JSON.stringify(asset1Data) },
    });

    console.log('*** Transaction committed successfully');
    console.log(`\n--> Submit Transaction: CreateAsset, ID: ${assetID2}`);

    const asset2Data = {
        objectType: assetType,
        assetID: assetID2,
        color: 'blue',
        size: 35,
        appraisedValue: 727,
    };

    await contract.submit('CreateAsset', {
        transientData: { asset_properties: JSON.stringify(asset2Data) },
    });

    console.log('*** Transaction committed successfully');
}

async function getAssetByRange(contract: Contract): Promise<void> {
    // GetAssetByRange returns assets on the ledger with ID in the range of startKey (inclusive) and endKey (exclusive).
    console.log(`\n--> Evaluate Transaction: GetAssetByRange from ${AirtelPrivateCollectionName}`);

    const resultBytes = await contract.evaluateTransaction(
        'GetAssetByRange',
        assetID1,
        `asset${String(now + 2)}`
    );

    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received empty query list for GetAssetByRange');
    }
    const result: unknown = JSON.parse(resultString);
    console.log('*** Result:', result);
}

async function readAssetByID(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Evaluate Transaction: ReadAsset, ID: ${assetID}`);
    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetID);

    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received empty result for ReadAsset');
    }
    const result: unknown = JSON.parse(resultString);
    console.log('*** Result:', result);
}

async function agreeToTransfer(contract: Contract, assetID: string): Promise<void> {
    // Buyer from Jio agrees to buy the asset.
    // To purchase the asset, the buyer needs to agree to the same value as the asset owner.

    const dataForAgreement = { assetID, appraisedValue: 100 };
    console.log('\n--> Submit Transaction: AgreeToTransfer, payload:', dataForAgreement);

    await contract.submit('AgreeToTransfer', {
        transientData: { asset_value: JSON.stringify(dataForAgreement) },
    });

    console.log('*** Transaction committed successfully');
}

async function readTransferAgreement(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Evaluate Transaction: ReadTransferAgreement, ID: ${assetID}`);

    const resultBytes = await contract.evaluateTransaction(
        'ReadTransferAgreement',
        assetID
    );

    const resultString = utf8Decoder.decode(resultBytes);
    if (!resultString) {
        doFail('Received no result for ReadTransferAgreement');
    }
    const result: unknown = JSON.parse(resultString);
    console.log('*** Result:', result);
}

async function transferAsset(contract: Contract, assetID: string): Promise<void> {
    console.log(`\n--> Submit Transaction: TransferAsset, ID: ${assetID}`);

    const buyerDetails = { assetID, buyerMSP: mspIdJio };
    await contract.submit('TransferAsset', {
        transientData: { asset_owner: JSON.stringify(buyerDetails) },
    });

    console.log('*** Transaction committed successfully');
}

async function deleteAsset(contract: Contract, assetID: string): Promise<void> {
    console.log('\n--> Submit Transaction: DeleteAsset, ID:', assetID);
    const dataForDelete = { assetID };
    await contract.submit('DeleteAsset', {
        transientData: { asset_delete: JSON.stringify(dataForDelete) },
    });

    console.log('*** Transaction committed successfully');
}

async function purgeAsset(contract: Contract, assetID: string): Promise<void> {
    console.log('\n--> Submit Transaction: PurgeAsset, ID:', assetID);
    const dataForPurge = { assetID };
    await contract.submit('PurgeAsset', {
        transientData: { asset_purge: JSON.stringify(dataForPurge) },
    });

    console.log('*** Transaction committed successfully');
}

async function readAssetPrivateDetails(contract: Contract, assetID: string, collectionName: string): Promise<boolean> {
    console.log(`\n--> Evaluate Transaction: ReadAssetPrivateDetails from ${collectionName}, ID: ${assetID}`);

    const resultBytes = await contract.evaluateTransaction(
        'ReadAssetPrivateDetails',
        collectionName,
        assetID
    );

    const resultJson = utf8Decoder.decode(resultBytes);
    if (!resultJson) {
        console.log('*** No result');
        return false;
    }
    const result: unknown = JSON.parse(resultJson);
    console.log('*** Result:', result);
    return true;
}

export function doFail(msgString: string): never {
    console.error(`${RED}\t${msgString}${RESET}`);
    throw new Error(msgString);
}

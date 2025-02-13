/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { connect, hash } from '@hyperledger/fabric-gateway';

import { newGrpcConnection, newIdentity, newSigner, tlsCertPathAirtel, peerEndpointAirtel, peerNameAirtel, certDirectoryPathAirtel, mspIdAirtel, keyDirectoryPathAirtel, tlsCertPathJio, peerEndpointJio, peerNameJio, certDirectoryPathJio, mspIdJio, keyDirectoryPathJio } from './connect';
import { ContractWrapper } from './contractWrapper';
import { RED, RESET } from './utils';

const channelName = 'mychannel';
const chaincodeName = 'secured';

// Use a random key so that we can run multiple times
const now = Date.now().toString();
let assetKey: string;

async function main(): Promise<void> {

    // The gRPC client connection from Airtel should be shared by all Gateway connections to this endpoint.
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

    // The gRPC client connection from Jio should be shared by all Gateway connections to this endpoint.
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

        // Get the smart contract from the network for Airtel.
        const contractAirtel = gatewayAirtel.getNetwork(channelName).getContract(chaincodeName);
        const contractWrapperAirtel  = new ContractWrapper(contractAirtel, mspIdAirtel);

        // Get the smart contract from the network for Jio.
        const contractJio = gatewayJio.getNetwork(channelName).getContract(chaincodeName);
        const contractWrapperJio  = new ContractWrapper(contractJio, mspIdJio);

        // Create an asset by organization Airtel, this only requires the owning organization to endorse.
        assetKey = await contractWrapperAirtel.createAsset(mspIdAirtel,
            `Asset owned by ${mspIdAirtel} is not for sale`, { ObjectType: 'asset_properties', Color: 'blue', Size: 35 });

        // Read the public details by Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdAirtel);

        // Read the public details by Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdAirtel);

        // Airtel should be able to read the private data details of the asset.
        await contractWrapperAirtel.getAssetPrivateProperties(assetKey, mspIdAirtel);

        // Jio is not the owner and does not have the private details, read expected to fail.
        try {
            await contractWrapperJio.getAssetPrivateProperties(assetKey, mspIdAirtel);
        } catch (e) {
            console.log(`${RED}*** Successfully caught the failure: getAssetPrivateProperties - ${String(e)}${RESET}`);
        }

        // Airtel updates the assets public description.
        await contractWrapperAirtel.changePublicDescription({assetId: assetKey,
            ownerOrg: mspIdAirtel,
            publicDescription: `Asset ${assetKey} owned by ${mspIdAirtel} is for sale`});

        // Read the public details by Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdAirtel);

        // Read the public details by Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdAirtel);

        // This is an update to the public state and requires the owner(Airtel) to endorse and sent by the owner org client (Airtel).
        // Since the client is from Jio, which is not the owner, this will fail.
        try{
            await contractWrapperJio.changePublicDescription({assetId: assetKey,
                ownerOrg: mspIdAirtel,
                publicDescription: `Asset ${assetKey} owned by ${mspIdJio} is NOT for sale`});
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: changePublicDescription - ${String(e)}${RESET}`);
        }

        // Read the public details by Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdAirtel);

        // Read the public details by Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdAirtel);

        // Agree to a sell by Airtel.
        await contractWrapperAirtel.agreeToSell({
            assetId: assetKey,
            price: 110,
            tradeId: now,
        });

        // Check the private information about the asset from Jio. Airtel would have to send Jio asset details,
        // so the hash of the details may be checked by the chaincode.
        await contractWrapperJio.verifyAssetProperties(assetKey, {color:'blue', size:35});

        // Agree to a buy by Jio.
        await contractWrapperJio.agreeToBuy( {assetId: assetKey,
            price: 100,
            tradeId: now}, { ObjectType: 'asset_properties', Color: 'blue', Size: 35 });

        // Airtel should be able to read the sale price of this asset.
        await contractWrapperAirtel.getAssetSalesPrice(assetKey, mspIdAirtel);

        // Jio has not set a sale price and this should fail.
        try{
            await contractWrapperJio.getAssetSalesPrice(assetKey, mspIdAirtel);
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: getAssetSalesPrice - ${String(e)}${RESET}`);
        }

        // Airtel has not agreed to buy so this should fail.
        try{
            await contractWrapperAirtel.getAssetBidPrice(assetKey, mspIdJio);
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: getAssetBidPrice - ${String(e)}${RESET}`);
        }
        // Jio should be able to see the price it has agreed.
        await contractWrapperJio.getAssetBidPrice(assetKey, mspIdJio);

        // Airtel will try to transfer the asset to Jio
        // This will fail due to the sell price and the bid price are not the same.
        try{
            await contractWrapperAirtel.transferAsset({ assetId: assetKey, price: 110, tradeId: now}, [ mspIdAirtel, mspIdJio ], mspIdAirtel, mspIdJio);
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: transferAsset - ${String(e)}${RESET}`);
        }
        // Agree to a sell by Airtel, the seller will agree to the bid price of Jio.
        await contractWrapperAirtel.agreeToSell({assetId:assetKey, price:100, tradeId:now});

        // Read the public details by  Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdAirtel);

        // Read the public details by  Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdAirtel);

        // Airtel should be able to read the private data details of the asset.
        await contractWrapperAirtel.getAssetPrivateProperties(assetKey, mspIdAirtel);

        // Airtel should be able to read the sale price of this asset.
        await contractWrapperAirtel.getAssetSalesPrice(assetKey, mspIdAirtel);

        // Jio should be able to see the price it has agreed.
        await contractWrapperJio.getAssetBidPrice(assetKey, mspIdJio);

        // Jio user will try to transfer the asset to Airtel.
        // This will fail as the owner is Airtel.
        try{
            await contractWrapperJio.transferAsset({ assetId: assetKey, price: 100, tradeId: now}, [ mspIdAirtel, mspIdJio ], mspIdAirtel, mspIdJio);
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: transferAsset - ${String(e)}${RESET}`);
        }

        // Airtel will transfer the asset to Jio.
        // This will now complete as the sell price and the bid price are the same.
        await contractWrapperAirtel.transferAsset({ assetId: assetKey, price: 100, tradeId: now}, [ mspIdAirtel, mspIdJio ], mspIdAirtel, mspIdJio);

        // Read the public details by  Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdJio);

        // Read the public details by  Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdJio);

        // Jio should be able to read the private data details of this asset.
        await contractWrapperJio.getAssetPrivateProperties(assetKey, mspIdJio);

        // Airtel should not be able to read the private data details of this asset, expected to fail.
        try{
            await contractWrapperAirtel.getAssetPrivateProperties(assetKey, mspIdJio);
        } catch(e) {
            console.log(`${RED}*** Successfully caught the failure: getAssetPrivateProperties - ${String(e)}${RESET}`);
        }

        // This is an update to the public state and requires only the owner to endorse.
        // Jio wants to indicate that the items is no longer for sale.
        await contractWrapperJio.changePublicDescription( {assetId: assetKey, ownerOrg: mspIdJio, publicDescription: `Asset ${assetKey} owned by ${mspIdJio} is NOT for sale`});

        // Read the public details by Airtel.
        await contractWrapperAirtel.readAsset(assetKey, mspIdJio);

        // Read the public details by Jio.
        await contractWrapperJio.readAsset(assetKey, mspIdJio);

    } finally {
        gatewayAirtel.close();
        gatewayJio.close();
        clientAirtel.close();
        clientJio.close();
    }
}

main().catch((error: unknown) => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

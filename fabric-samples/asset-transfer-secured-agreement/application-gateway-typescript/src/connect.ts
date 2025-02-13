/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

// MSP Id's of Organizations
export const mspIdAirtel = 'AirtelMSP';
export const mspIdJio = 'JioMSP';

// Path to Airtel crypto materials.
export const cryptoPathAirtel = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'Airtel.example.com');

// Path to user private key directory.
export const keyDirectoryPathAirtel = path.resolve(cryptoPathAirtel, 'users', 'User1@Airtel.example.com', 'msp', 'keystore');

// Path to user certificate.
export const certDirectoryPathAirtel = path.resolve(cryptoPathAirtel, 'users', 'User1@Airtel.example.com', 'msp', 'signcerts');

// Path to peer tls certificate.
export const tlsCertPathAirtel = path.resolve(cryptoPathAirtel, 'peers', 'peer0.Airtel.example.com', 'tls', 'ca.crt');

// Path to Jio crypto materials.
export const cryptoPathJio = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'test-network',
    'organizations',
    'peerOrganizations',
    'Jio.example.com'
);

// Path to Jio user private key directory.
export const keyDirectoryPathJio = path.resolve(
    cryptoPathJio,
    'users',
    'User1@Jio.example.com',
    'msp',
    'keystore'
);

// Path to Jio user certificate.
export const certDirectoryPathJio = path.resolve(
    cryptoPathJio,
    'users',
    'User1@Jio.example.com',
    'msp',
    'signcerts'
);

// Path to Jio peer tls certificate.
export const tlsCertPathJio = path.resolve(
    cryptoPathJio,
    'peers',
    'peer0.Jio.example.com',
    'tls',
    'ca.crt'
);
// Gateway peer endpoint.
export const peerEndpointAirtel = 'localhost:7051';
export const peerEndpointJio = 'localhost:9051';

// Gateway peer container name.
export const peerNameAirtel = 'peer0.Airtel.example.com';
export const peerNameJio = 'peer0.Jio.example.com';

// Collection Names
export const AirtelPrivateCollectionName = 'AirtelMSPPrivateCollection';
export const JioPrivateCollectionName = 'JioMSPPrivateCollection';

export async function newGrpcConnection(
    tlsCertPath: string,
    peerEndpoint: string,
    peerName: string
): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerName,
    });
}

export async function newIdentity(certDirectoryPath: string, mspId: string): Promise<Identity> {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

export async function newSigner(keyDirectoryPath: string): Promise<Signer> {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

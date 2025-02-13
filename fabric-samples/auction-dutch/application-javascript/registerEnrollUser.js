/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPAirtel, buildCCPJio, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const mspAirtel = 'AirtelMSP';
const mspJio = 'JioMSP';

async function connectToAirtelCA (UserID) {
	console.log('\n--> Register and enrolling new user');
	const ccpAirtel = buildCCPAirtel();
	const caAirtelClient = buildCAClient(FabricCAServices, ccpAirtel, 'ca.Airtel.example.com');

	const walletPathAirtel = path.join(__dirname, 'wallet/Airtel');
	const walletAirtel = await buildWallet(Wallets, walletPathAirtel);

	await registerAndEnrollUser(caAirtelClient, walletAirtel, mspAirtel, UserID, 'Airtel.department1');
}

async function connectToJioCA (UserID) {
	console.log('\n--> Register and enrolling new user');
	const ccpJio = buildCCPJio();
	const caJioClient = buildCAClient(FabricCAServices, ccpJio, 'ca.Jio.example.com');

	const walletPathJio = path.join(__dirname, 'wallet/Jio');
	const walletJio = await buildWallet(Wallets, walletPathJio);

	await registerAndEnrollUser(caJioClient, walletJio, mspJio, UserID, 'Jio.department1');
}
async function main () {
	if (process.argv[2] === undefined && process.argv[3] === undefined) {
		console.log('Usage: node registerEnrollUser.js org userID');
		process.exit(1);
	}

	const org = process.argv[2];
	const userId = process.argv[3];

	try {
		if (org === 'Airtel' || org === 'Airtel') {
			await connectToAirtelCA(userId);
		} else if (org === 'Jio' || org === 'Jio') {
			await connectToJioCA(userId);
		} else {
			console.log('Usage: node registerEnrollUser.js org userID');
			console.log('Org must be Airtel or Jio');
		}
	} catch (error) {
		console.error(`Error in enrolling admin: ${error}`);
		process.exit(1);
	}
}

main();

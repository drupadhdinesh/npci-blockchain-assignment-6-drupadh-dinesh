/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPAirtel, buildCCPJio, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const mspAirtel = 'AirtelMSP';
const mspJio = 'JioMSP';

async function connectToAirtelCA() {
	console.log('\n--> Enrolling the Airtel CA admin');
	const ccpAirtel = buildCCPAirtel();
	const caAirtelClient = buildCAClient(FabricCAServices, ccpAirtel, 'ca.Airtel.example.com');

	const walletPathAirtel = path.join(__dirname, 'wallet/Airtel');
	const walletAirtel = await buildWallet(Wallets, walletPathAirtel);

	await enrollAdmin(caAirtelClient, walletAirtel, mspAirtel);

}

async function connectToJioCA() {
	console.log('\n--> Enrolling the Jio CA admin');
	const ccpJio = buildCCPJio();
	const caJioClient = buildCAClient(FabricCAServices, ccpJio, 'ca.Jio.example.com');

	const walletPathJio = path.join(__dirname, 'wallet/Jio');
	const walletJio = await buildWallet(Wallets, walletPathJio);

	await enrollAdmin(caJioClient, walletJio, mspJio);

}
async function main() {

	if (process.argv[2] === undefined) {
		console.log('Usage: node enrollAdmin.js Org');
		process.exit(1);
	}

	const org = process.argv[2];

	try {

		if (org === 'Airtel' || org === 'Airtel') {
			await connectToAirtelCA();
		}
		else if (org === 'Jio' || org === 'Jio') {
			await connectToJioCA();
		} else {
			console.log('Usage: node registerUser.js org userID');
			console.log('Org must be Airtel or Jio');
		}
	} catch (error) {
		console.error(`Error in enrolling admin: ${error}`);
		process.exit(1);
	}
}

main();

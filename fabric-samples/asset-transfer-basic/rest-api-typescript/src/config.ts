/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The sample REST server can be configured using the environment variables
 * documented below
 *
 * In a local development environment, these variables can be loaded from a
 * .env file by starting the server with the following command:
 *
 *   npm start:dev
 *
 * The scripts/generateEnv.sh script can be used to generate a suitable .env
 * file for the Fabric Test Network
 */

import * as env from 'env-var';

export const Airtel = 'Airtel';
export const Jio = 'Jio';

export const JOB_QUEUE_NAME = 'submit';

/**
 * Log level for the REST server
 */
export const logLevel = env
    .get('LOG_LEVEL')
    .default('info')
    .asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

/**
 * The port to start the REST server on
 */
export const port = env
    .get('PORT')
    .default('3000')
    .example('3000')
    .asPortNumber();

/**
 * The type of backoff to use for retrying failed submit jobs
 */
export const submitJobBackoffType = env
    .get('SUBMIT_JOB_BACKOFF_TYPE')
    .default('fixed')
    .asEnum(['fixed', 'exponential']);

/**
 * Backoff delay for retrying failed submit jobs in milliseconds
 */
export const submitJobBackoffDelay = env
    .get('SUBMIT_JOB_BACKOFF_DELAY')
    .default('3000')
    .example('3000')
    .asIntPositive();

/**
 * The total number of attempts to try a submit job until it completes
 */
export const submitJobAttempts = env
    .get('SUBMIT_JOB_ATTEMPTS')
    .default('5')
    .example('5')
    .asIntPositive();

/**
 * The maximum number of submit jobs that can be processed in parallel
 */
export const submitJobConcurrency = env
    .get('SUBMIT_JOB_CONCURRENCY')
    .default('5')
    .example('5')
    .asIntPositive();

/**
 * The number of completed submit jobs to keep
 */
export const maxCompletedSubmitJobs = env
    .get('MAX_COMPLETED_SUBMIT_JOBS')
    .default('1000')
    .example('1000')
    .asIntPositive();

/**
 * The number of failed submit jobs to keep
 */
export const maxFailedSubmitJobs = env
    .get('MAX_FAILED_SUBMIT_JOBS')
    .default('1000')
    .example('1000')
    .asIntPositive();

/**
 * Whether to initialise a scheduler for the submit job queue
 * There must be at least on queue scheduler to handle retries and you may want
 * more than one for redundancy
 */
export const submitJobQueueScheduler = env
    .get('SUBMIT_JOB_QUEUE_SCHEDULER')
    .default('true')
    .example('true')
    .asBoolStrict();

/**
 * Whether to convert discovered host addresses to be 'localhost'
 * This should be set to 'true' when running a docker composed fabric network on the
 * local system, e.g. using the test network; otherwise should it should be 'false'
 */
export const asLocalhost = env
    .get('AS_LOCAL_HOST')
    .default('true')
    .example('true')
    .asBoolStrict();

/**
 * The Airtel MSP ID
 */
export const mspIdAirtel = env
    .get('HLF_MSP_ID_Airtel')
    .default(`${Airtel}MSP`)
    .example(`${Airtel}MSP`)
    .asString();

/**
 * The Jio MSP ID
 */
export const mspIdJio = env
    .get('HLF_MSP_ID_Jio')
    .default(`${Jio}MSP`)
    .example(`${Jio}MSP`)
    .asString();

/**
 * Name of the channel which the basic asset sample chaincode has been installed on
 */
export const channelName = env
    .get('HLF_CHANNEL_NAME')
    .default('mychannel')
    .example('mychannel')
    .asString();

/**
 * Name used to install the basic asset sample
 */
export const chaincodeName = env
    .get('HLF_CHAINCODE_NAME')
    .default('basic')
    .example('basic')
    .asString();

/**
 * The transaction submit timeout in seconds for commit notification to complete
 */
export const commitTimeout = env
    .get('HLF_COMMIT_TIMEOUT')
    .default('300')
    .example('300')
    .asIntPositive();

/**
 * The transaction submit timeout in seconds for the endorsement to complete
 */
export const endorseTimeout = env
    .get('HLF_ENDORSE_TIMEOUT')
    .default('30')
    .example('30')
    .asIntPositive();

/**
 * The transaction query timeout in seconds
 */
export const queryTimeout = env
    .get('HLF_QUERY_TIMEOUT')
    .default('3')
    .example('3')
    .asIntPositive();

/**
 * The Airtel connection profile JSON
 */
export const connectionProfileAirtel = env
    .get('HLF_CONNECTION_PROFILE_Airtel')
    .required()
    .example(
        '{"name":"test-network-Airtel","version":"1.0.0","client":{"organization":"Airtel" ... }'
    )
    .asJsonObject() as Record<string, unknown>;

/**
 * Certificate for an Airtel identity to evaluate and submit transactions
 */
export const certificateAirtel = env
    .get('HLF_CERTIFICATE_Airtel')
    .required()
    .example(
        '"-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\\n"'
    )
    .asString();

/**
 * Private key for an Airtel identity to evaluate and submit transactions
 */
export const privateKeyAirtel = env
    .get('HLF_PRIVATE_KEY_Airtel')
    .required()
    .example(
        '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"'
    )
    .asString();

/**
 * The Jio connection profile JSON
 */
export const connectionProfileJio = env
    .get('HLF_CONNECTION_PROFILE_Jio')
    .required()
    .example(
        '{"name":"test-network-Jio","version":"1.0.0","client":{"organization":"Jio" ... }'
    )
    .asJsonObject() as Record<string, unknown>;

/**
 * Certificate for an Jio identity to evaluate and submit transactions
 */
export const certificateJio = env
    .get('HLF_CERTIFICATE_Jio')
    .required()
    .example(
        '"-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----\\n"'
    )
    .asString();

/**
 * Private key for an Jio identity to evaluate and submit transactions
 */
export const privateKeyJio = env
    .get('HLF_PRIVATE_KEY_Jio')
    .required()
    .example(
        '"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"'
    )
    .asString();

/**
 * The host the Redis server is running on
 */
export const redisHost = env
    .get('REDIS_HOST')
    .default('localhost')
    .example('localhost')
    .asString();

/**
 * The port the Redis server is running on
 */
export const redisPort = env
    .get('REDIS_PORT')
    .default('6379')
    .example('6379')
    .asPortNumber();

/**
 * Username for the Redis server
 */
export const redisUsername = env
    .get('REDIS_USERNAME')
    .example('fabric')
    .asString();

/**
 * Password for the Redis server
 */
export const redisPassword = env.get('REDIS_PASSWORD').asString();

/**
 * API key for Airtel
 * Specify this API key with the X-Api-Key header to use the Airtel connection profile and credentials
 */
export const AirtelApiKey = env
    .get('Airtel_APIKEY')
    .required()
    .example('123')
    .asString();

/**
 * API key for Jio
 * Specify this API key with the X-Api-Key header to use the Jio connection profile and credentials
 */
export const JioApiKey = env
    .get('Jio_APIKEY')
    .required()
    .example('456')
    .asString();

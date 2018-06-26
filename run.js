const speedTest = require('speedtest-net');
const { MongoClient } = require('mongodb');
const Random = require('meteor-random-node');

let client;
let connecting;

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.MONGO_DATABASE;

async function connect() {
    if (!client) {
        client = new MongoClient(MONGO_URL);
        connecting = client.connect();
    }

    await connecting;

    return client.db(DB_NAME);
}

async function close() {
    if (client) {
        await client.close(true);
        client = undefined;
        connecting = undefined;
    }
}

async function store({ start, end, data, ...other }) {
    const db = await connect();
    const collection = db.collection('results');

    const {
        speeds: { download, upload },
    } = data;

    await collection.insertOne({
        _id: Random.id(),
        start,
        end,
        ...other,
        download,
        upload,
        ...data,
    });
}

function runTest() {
    return new Promise((resolve, reject) => {
        console.log('starting speed test ...');
        const start = new Date();
        const test = speedTest({ maxTime: 5000 });
        test.on('data', data => {
            const end = new Date();
            resolve({
                start,
                end,
                duration: end.getTime() - start.getTime(),
                data,
            });
        });

        test.on('error', reject);
    });
}

async function run() {
    try {
        const data = await runTest();
        console.dir(data);
        await store(data);
    } catch (error) {
        console.error('error running speed test', error);
    } finally {
        await close();
    }
}

module.exports = run;

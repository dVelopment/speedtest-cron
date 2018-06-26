#!/usr/bin/env node

require('dotenv').config();

const cluster = require('cluster');
const run = require('./run');

const WAIT_SECONDS = process.env.WAIT_SECONDS
    ? parseInt(process.env.WAIT_SECONDS, 10)
    : 3600;
const WAIT_MS = WAIT_SECONDS * 1000;

let interval;
let currentWorker;
let lastTest;
let running = false;

function closeWorker() {
    if (currentWorker && !currentWorker.isDead()) {
        currentWorker.kill();
    }
}

function scheduler() {
    if (!running && (!lastTest || Date.now() - lastTest >= WAIT_MS)) {
        closeWorker();
        lastTest = Date.now();
        running = true;
        currentWorker = cluster.fork();
    }
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    cluster.on('exit', (worker, code, signal) => {
        running = false;
        console.log(
            `worker ${
                worker.process.pid
            } ended with code ${code} and signal "${signal}"`,
        );
    });

    interval = setInterval(scheduler, 1000);

    process.on('exit', () => {
        closeWorker();
        clearInterval(interval);
    });
    process.on('SIGINT', () => {
        console.log('SIGINT received');
        closeWorker(), clearInterval(interval);
        process.exit(0);
    });
} else {
    console.log(`Worker ${process.pid} started`);

    run().then(
        () => {
            console.log('test finished');
            process.exit(0);
        },
        error => {
            console.error('error running test', error);
            process.exit(1);
        },
    );
}

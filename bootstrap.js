#!/usr/bin/env node

require('dotenv').config();

const cluster = require('cluster');
const run = require('./run');
const later = require('later');

const CRON_PATTERN = process.env.CRON_PATTERN || '0 * * * *';

let currentWorker;
let running = false;

function closeWorker() {
    if (currentWorker && !currentWorker.isDead()) {
        currentWorker.kill();
    }
}

function startWorker() {
    if (!running) {
        closeWorker();
        currentWorker = cluster.fork();
        running = true;
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

    const schedule = later.parse.cron(CRON_PATTERN);
    const timer = later.setInterval(startWorker, schedule);

    process.on('exit', () => {
        closeWorker();
        timer.clear();
    });
    process.on('SIGINT', () => {
        console.log('SIGINT received');
        closeWorker();
        timer.clear();
        process.exit(0);
    });
} else {
    console.log(`Worker ${process.pid} started`);

    run().then(
        () => {
            console.log('test finished');
        },
        error => {
            console.error('error running test', error);
        },
    );
}

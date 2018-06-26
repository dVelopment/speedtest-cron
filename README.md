# speedtest-cron

run a speed test and store the result to MongoDB

## Setup

```shell
# clone the repository
git clone https://github.com/dVelopment/speedtest-cron.git

cd speedtest-cron

# create an environment file
echo 'MONGO_URL=mongodb://localhost:27017/speedtests' > .env
echo 'MONGO_DATABASE=speedtests' >> .env

# install dependencies
yarn

# start it
yarn start
```

## Advanced setup (cronjob via [pm2](https://pm2.io/))

1.  install pm2 (shown with using nvm)

    ```shell
    cd path/to/speedtest-cron
    nvm i
    npm i -g pm2
    ```

1.  create a config file `/home/user/speedtests.json`

    ```json
    {
        "name": "speedtests",
        "cwd": "/home/user/speedtest-cron",
        "script": "bootstrap.js",
        "exec_interpreter": "/home/user/.nvm/versions/node/v8.9.4/bin/node"
    }
    ```

1.  start it

    ```shell
    cd ~
    pm2 start speedtests.json
    pm2 save
    ```

    You might want to follow the instructions of
    `pm2 startup` to setup restarting jobs after reboot.

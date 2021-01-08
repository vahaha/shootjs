const Promise = require('bluebird')
const chalk = require('chalk')
const redis = require('./redis')
const mongodb = require('./mongodb')

const dbs = { Redis: redis, MongoDB: mongodb }

exports.redis = redis
exports.mongodb = mongodb

const { STARTING_TIMEOUT } = process.env
const WAITING_TIME = 1000 // ms

let timeCounting = 0

exports.initConnections = async () => {
    if (timeCounting > STARTING_TIMEOUT) {
        console.log(chalk.red('Cannot connect to db'))
        throw new Error('Cannot start')
    }

    let isConnected = true
    await Promise.all(
        Object.keys(dbs).map(async dbname => {
            const isConnectedDB = await dbs[dbname].checkConnection()
            if (!isConnectedDB) {
                isConnected = false
                console.log(chalk.yellow('Waiting for connection to ' + dbname))
            }
            return
        })
    )
    if (!isConnected) {
        timeCounting += WAITING_TIME
        await Promise.delay(WAITING_TIME)
        return exports.initConnections()
    }
    return true
}

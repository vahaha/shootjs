const mongoose = require('mongoose')
const chalk = require('chalk')

const Messages = require('../config/messages')
/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
const { MONGODB_URL } = process.env
let isConnected = false

mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
})

console.log(chalk.yellow('Connecting to MongoDB ...'))

const { connection: conn } = mongoose

conn.on('connected', () => {
    console.log(chalk.blue('Connected to MongoDB'))
    isConnected = true
})

conn.on('disconnected', () => {
    console.log(chalk.blue('Disconnected to MongoDB'))
    isConnected = false
})

conn.on('error', console.error.bind(console, 'MongoDB connection error:'))

const getPaginationData = async (model, pagingData) => {
    if (!pagingData || !model) {
        return Promise.reject(Messages.dataInputFail)
    }
    const { pageSize = 100, pageIndex = 1 } = pagingData
    const skips = pageSize * (pageIndex - 1)
    const dataList = await model.find().skip(skips).limit(pageSize)
    return dataList
}

mongoose.Promise = global.Promise

module.exports = {
    connection: conn,
    checkConnection: () => Promise.resolve(isConnected),
    AdminDB: mongoose.connection.useDb('vAdmin'),
    AccountDB: mongoose.connection.useDb('vaccount'),
    AppDB: mongoose.connection.useDb('vApp'),
    getPaginationData,
}

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log(
            'Mongoose default connection is disconnected due to application termination'
        )
    })
})

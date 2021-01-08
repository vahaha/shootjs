/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
const dotenv = require('dotenv')
const path = require('path')
const { getArg } = require('../utils')

dotenv.config({
    path: path.join(__dirname, `../../env/${process.env.NODE_ENV}.env`),
})

dotenv.config({
    path: path.join(__dirname, `../../env/default.env`),
})

const { env } = process

const argMongodbUrl = getArg('db-server')

env.MONGODB_URL = argMongodbUrl || env.MONGODB_URL

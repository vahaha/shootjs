const chalk = require('chalk')
const Redis = require('ioredis')
const ms = require('ms')
const zlib = require('zlib')

const { env } = process

const genKey = (cluster_key, primary_key) =>
    `{${env.REDIS_PREFIX}${cluster_key}}:${primary_key}`

const getNewConnection = () => {
    const node = {
        port: env.REDIS_PORT,
        host: env.REDIS_HOST,
    }

    const options = {
        password: env.REDIS_PASSWORD,
    }

    if (env.REDIS_MODE === 'cluster') {
        return new Redis.Cluster([node], { redisOptions: options })
    }

    // default
    options.db = env.REDIS_DB

    return new Redis(node.port, node.host, options)
}

const redis = getNewConnection()
const pubsub = getNewConnection()

const checkConnectionTimer = setInterval(() => {
    if (redis.status === 'ready') {
        clearInterval(checkConnectionTimer)
        console.log(
            chalk.blue('Connected to Redis: ') +
                chalk.green(`${env.REDIS_HOST}:${env.REDIS_PORT}`)
        )
    }
}, 100)

/**
 * Get a caching, if not then execute a function and cache result
 * @param {object} options {key: "cache key", ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFn = async (
    { key, ttl = 60, json = false, compress = false },
    fn
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    let cached = await redis.get(key)
    if (!cached) {
        const result = await fn()
        let val = json ? JSON.stringify(result) : result
        if (compress) {
            val = zlib.gzipSync(val).toString('base64')
        }
        redis.set(key, val, 'EX', ttlInSecond)

        return result
    }

    if (compress) {
        cached = zlib.gunzipSync(Buffer.from(cached, 'base64')).toString('utf8')
    }
    if (json) {
        cached = JSON.parse(cached)
    }

    return cached
}

/**
 * Get a caching, if not then execute a function and cache result
 * @param {object} options {key: "cache key", field: "cache field" ttl: time_in_second, json: is_json}
 * @param {function} fn function will be executed if caching not found
 * @return return object if option json = true else return a string
 */
const cachedFnH = async (
    { key, field, ttl = 60, json = false, compress = false },
    fn
) => {
    if (!(typeof ttl === 'number') && !(typeof ttl === 'string')) {
        throw new TypeError(
            `expecting ttl to be number (second) or string, got ${typeof ttl}`
        )
    }

    let ttlInSecond = ttl
    if (typeof ttl === 'string') {
        ttlInSecond = ms(ttl) / 1000
    }

    const is_exists = await redis.exists(key)
    let result = null
    if (is_exists) {
        result = await redis.hget(key, field)
        if (result) {
            if (compress)
                result = zlib
                    .gunzipSync(Buffer.from(result, 'base64'))
                    .toString('utf8')
            if (json) result = JSON.parse(result)
        }
    }
    if (!is_exists || !result) {
        result = await Promise.resolve(fn())
        let val = json ? JSON.stringify(result) : result
        if (compress) val = zlib.gzipSync(val).toString('base64')

        redis.hset(key, field, val)
    }
    if (!is_exists) {
        redis.expire(key, ttlInSecond)
    }

    return result
}

const checkConnection = async () => {
    return Promise.resolve(redis.status)
        .then(result => result === 'ready')
        .catch(error => false)
}

module.exports = {
    connection: redis,
    getPubSub: () => pubsub,
    getNewConnection,
    genKey,
    cachedFn,
    cachedFnH,
    checkConnection,
}

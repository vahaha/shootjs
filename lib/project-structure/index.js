const chalk = require('chalk')
console.log(chalk.blue('Environment:'), chalk.green(process.env.NODE_ENV))

const bootstrap = require('./bootstrap')

bootstrap
    .load()
    .then(() => {
        try {
            const { PORT } = process.env
            const app = require('./www/app')

            app.listen(PORT, () =>
                console.log(
                    chalk.blue('Server is listening on port: ') +
                        chalk.green(PORT)
                )
            )
        } catch (err) {
            console.error('Occurs error when starting server\n', err)
            throw err
        }
    })
    .catch(err => {
        console.log(chalk.yellow('Server is stopping ...'))
        process.exit(1)
    })

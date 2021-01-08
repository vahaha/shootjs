const commander = require('commander') // (normal include)
const program = new commander.Command()

// Example program using the command configuration option isDefault to specify the default command.
//
// $ node defaultCommand.js build
// build
// $ node defaultCommand.js serve -p 8080
// server on port 8080
// $ node defaultCommand.js -p 443
// server on port 443

program.version('0.0.1', '-v', '--ver', "shootjs's version").parse()
program
    .command('build')
    .description('build web site for deployment')
    .action(() => {
        console.log('build')
    })

program
    .command('deploy')
    .description('deploy web site to production')
    .action(() => {
        console.log('deploy')
    })

program
    .command('serve', { isDefault: true })
    .description('launch web server')
    .option('-p,--port <port_number>', 'web port')
    .action(opts => {
        console.log(`server on port ${opts.port}`)
    })

program.parse(process.argv)

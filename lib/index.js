// ./lib/index.js
const { Command } = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const {
    paramCase,
    constantCase,
    camelCase,
    pascalCase,
} = require('change-case')

const pkg = require('../package.json')
const basePackage = require('./project-structure/package.json')

const program = new Command()

program.version(pkg.version, '-v', 'current version')

function commaSeparatedList(value, dummyPrevious) {
    return value.split(',')
}

program
    .command('component <name>')
    .option('-f', '--files', 'list of files')
    .description('create component')
    .action((name, options) => {
        execAndExit(createComponent, name)
    })

program
    .command('init')
    .description('init project')
    .action(() => {
        execAndExit(initProject)
    })

program.parse()

function execAndExit(fn, ...args) {
    fn(...args)
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e.message)
            process.exit(1)
        })
}

function _genRequire(name, types = []) {
    return types
        .map(
            type =>
                `const ${pascalCase(
                    name + '_' + type
                )} = require('./${type.toLowerCase()}')`
        )
        .join('\n')
}
async function createComponent(name) {
    const cwd = process.cwd()
    const dirComponents = path.join(cwd, 'src', 'components')
    if (!fs.existsSync(dirComponents)) {
        throw new Error('Folder ' + dirComponents + ' does not exist.')
    }
    const dir = path.join(dirComponents, paramCase(name))
    if (fs.existsSync(dir)) {
        throw new Error('Folder ' + paramCase(name) + ' already exists.')
    }

    fs.mkdirSync(dir)

    fs.writeFileSync(path.join(dir, 'static.js'), '', 'utf8')
    fs.writeFileSync(
        path.join(dir, 'model.js'),
        _genRequire(name, ['static', 'cache']),
        'utf8'
    )
    fs.writeFileSync(
        path.join(dir, 'cache.js'),
        _genRequire(name, ['model']),
        'utf8'
    )
    fs.writeFileSync(
        path.join(dir, 'service.js'),
        _genRequire(name, ['model', 'cache']),
        'utf8'
    )
    fs.writeFileSync(
        path.join(dir, 'controller.js'),
        _genRequire(name, ['service']),
        'utf8'
    )
    fs.writeFileSync(
        path.join(dir, 'route.js'),
        _genRequire(name, ['controller']),
        'utf8'
    )
    // index.js
    fs.copyFileSync(
        path.join(
            __dirname,
            'project-structure',
            'src',
            'components',
            'temp',
            'index.js'
        ),
        path.join(dir, 'index.js')
    )
}

async function initProject() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'name:',
            default: function () {
                return process.cwd().split(path.sep).pop()
            },
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'version',
            message: 'version:',
            default: '1.0.0',
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'description',
            message: 'description:',
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'main',
            message: 'entry point:',
            default: 'index.js',
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'repository',
            message: 'repository url:',
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'author',
            message: 'author:',
            prefix: chalk.gray('question'),
        },
        {
            type: 'input',
            name: 'license',
            message: 'license:',
            default: 'MIT',
            prefix: chalk.gray('question'),
        },
    ])

    const packageJson = {
        ...answers,
        ...basePackage,
    }

    const cwd = process.cwd()

    fs.writeFileSync(
        path.join(cwd, 'package.json'),
        JSON.stringify(packageJson, null, 2),
        'utf8'
    )
    // var dir = {
    //     env: ['.local.env', '.staging.env', '.production.env'],
    //     src: {
    //         conponents: [],
    //         connections: [],
    //         configs: [],
    //         utils: [],
    //         www: ['app.js', 'router.js', 'response-handler.js'],
    //         'index.js': 0,
    //         'bootstrap.js': 0,
    //     },
    // }

    // if (!fs.existsSync(dir)) {
    //     fs.mkdirSync(dir)
    // }
    fs.copyFileSync(
        path.join(__dirname, '.gitignore'),
        path.join(cwd, '.gitignore')
    )
}

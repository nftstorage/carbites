#!/usr/bin/env node

import meow from 'meow'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import bytes from 'bytes'
import { CarSplitter, CarJoiner } from '../index.js'
import { RootedCarSplitter, RootedCarJoiner } from '../rooted/index.js'

async function split (argv) {
  const cli = meow({
    importMeta: import.meta,
    argv,
    help: `
      Usage
        $ carbites split <filename>

      Options
        --size, -s    Target size in bytes to chunk CARs to (default 1KB).
        --rooted, -r  Create a single root node in every CAR (default false).
    `,
    flags: {
      size: {
        type: 'string',
        alias: 's',
        default: '100MB'
      },
      rooted: {
        type: 'boolean',
        alias: 'r',
        default: false
      }
    }
  })

  if (cli.input.length === 0) {
    return cli.showHelp()
  }

  const input = fs.createReadStream(cli.input[0])
  const name = cli.input[0].replace('.car', '')
  const size = bytes.parse(cli.flags.size)

  const splitter = cli.flags.rooted
    ? new RootedCarSplitter(input, size)
    : new CarSplitter(input, size)

  let i = 0
  for await (const car of splitter.cars()) {
    await pipeline(car, fs.createWriteStream(`${name}-${i}.car`))
    i++
  }
}

async function join (argv) {
  const cli = meow({
    importMeta: import.meta,
    argv,
    help: `
      Usage
        $ carbites join <filename> [...filename]

      Options
        --output, -o  Output path for resulting CAR.
        --rooted, -r  CAR files all contain a carbites root node (default false).
    `,
    flags: {
      rooted: {
        type: 'boolean',
        alias: 'r',
        default: false
      },
      output: {
        type: 'string',
        alias: 'o',
        isRequired: true
      }
    }
  })

  if (cli.input.length === 0) {
    return cli.showHelp()
  }

  const cars = cli.input.map(p => fs.createReadStream(p))

  const joiner = cli.flags.rooted
    ? new RootedCarJoiner(cars)
    : new CarJoiner(cars)

  await pipeline(joiner.car(), fs.createWriteStream(cli.flags.output))
}

const cli = meow({
  importMeta: import.meta,
  help: `
  Usage
    $ carbites <command>

    Commands
      split
      join
  `
})

const cmdArgs = process.argv.slice(3)

switch (cli.input[0]) {
  case 'split': split(cmdArgs); break
  case 'join': join(cmdArgs); break
  default: cli.showHelp()
}

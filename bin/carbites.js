#!/usr/bin/env node

import meow from 'meow'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import bytes from 'bytes'
import { CarIndexedReader, CarReader } from '@ipld/car'
import { SimpleCarSplitter, SimpleCarJoiner } from '../lib/simple/index.js'
import { RootedCarSplitter, RootedCarJoiner } from '../lib/rooted/index.js'
import { TreewalkCarSplitter, TreewalkCarJoiner } from '../lib/treewalk/index.js'

async function split (argv) {
  const cli = meow({
    importMeta: import.meta,
    argv,
    help: `
      Usage
        $ carbites split <filename>

      Options
        --size,     -s  Target size in bytes to chunk CARs to (default 1KB).
        --strategy, -t  Strategy for splitting CAR files "simple", "rooted" or "treewalk" (default simple).
    `,
    flags: {
      size: {
        type: 'string',
        alias: 's',
        default: '100MB'
      },
      strategy: {
        type: 'string',
        alias: 't',
        default: 'simple'
      }
    }
  })

  if (cli.input.length === 0) {
    return cli.showHelp()
  }

  // const input = await CarIndexedReader.fromFile(cli.input[0])
  const input = await CarReader.fromIterable(fs.createReadStream(cli.input[0]))
  const name = cli.input[0].replace('.car', '')
  const size = bytes.parse(cli.flags.size)

  let CarSplitter = SimpleCarSplitter
  if (cli.flags.strategy === 'treewalk') {
    CarSplitter = TreewalkCarSplitter
  } else if (cli.flags.strategy === 'rooted') {
    CarSplitter = RootedCarSplitter
  }

  const splitter = new CarSplitter(input, size)
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
        --output,   -o  Output path for resulting CAR.
        --strategy, -t  Strategy for splitting CAR files "simple", "rooted" or "treewalk" (default simple).
    `,
    flags: {
      simple: {
        type: 'string',
        alias: 't',
        default: 'simple'
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

  const cars = await Promise.all(cli.input.map(p => CarIndexedReader.fromFile(p)))

  let CarJoiner = SimpleCarJoiner
  if (cli.flags.strategy === 'treewalk') {
    CarJoiner = TreewalkCarJoiner
  } else if (cli.flags.strategy === 'rooted') {
    CarJoiner = RootedCarJoiner
  }

  const joiner = new CarJoiner(cars)

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

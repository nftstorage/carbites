#!/usr/bin/env node

import fs from 'fs'
import { pipeline } from 'stream/promises'
import { CarReader } from '@ipld/car'
import bytes from 'bytes'
import { Carbites } from '../index.js'

async function main () {
  if (!process.argv[2]) {
    throw new Error('missing car')
  }

  const input = fs.createReadStream(process.argv[2])
  const name = process.argv[2].replace('.car', '')

  let size = 1024
  if (process.argv[3]) {
    if (process.argv[3] === '--size') {
      size = bytes.parse(process.argv[4])
    } else {
      size = bytes.parse(process.argv[3].split('=')[1])
    }
  }

  const reader = await CarReader.fromIterable(input)
  const cb = new Carbites(reader, size)
  let i = 0
  for await (const car of cb.cars()) {
    await pipeline(car, fs.createWriteStream(`${name}-${i}.car`))
    i++
  }
}

main()

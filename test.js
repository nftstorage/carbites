import test from 'ava'
import { CarWriter, CarReader } from '@ipld/car'
import { garbage } from 'ipld-garbage'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { Carbites } from './index.js'

function randomInt (min, max) {
  return Math.random() * (max - min) + min
}

async function randomCar (targetSize) {
  const blocks = []
  let size = 0
  while (size < targetSize) {
    const bytes = dagCbor.encode(garbage(randomInt(1, targetSize)))
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, dagCbor.code, hash)
    blocks.push({ cid, bytes })
    size += bytes.length
  }
  const { writer, out } = CarWriter.create(blocks.map(b => b.cid))
  blocks.forEach(b => writer.put(b))
  writer.close()
  return out
}

async function collect (iterable) {
  const chunks = []
  for await (const chunk of iterable) {
    chunks.push(chunk)
  }
  return chunks
}

async function collectBytes (iterable) {
  const chunks = await collect(iterable)
  return new Uint8Array([].concat(...chunks.map(c => Array.from(c))))
}

function bytesEqual (b0, b1) {
  return b0.length === b1.length && b0.every((v, i) => v === b1[i])
}

test('chunk in ~two', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const reader = await CarReader.fromBytes(bytes)
  const chunker = new Carbites(reader, targetSize)
  const cars = []
  for await (const car of chunker.cars()) {
    cars.push(car)
  }
  t.true(cars.length >= 2)
  const chunkedBlocks = []
  for (const c of cars) {
    const bs = await collect((await CarReader.fromIterable(c)).blocks())
    chunkedBlocks.push(...bs)
  }
  t.is(blocks.length, chunkedBlocks.length)
})

test('target size bigger than file size', async t => {
  const bytes = await collectBytes(await randomCar(1000))
  const reader = await CarReader.fromBytes(bytes)
  const chunker = new Carbites(reader, Infinity)
  const cars = []
  for await (const car of chunker.cars()) {
    cars.push(car)
  }
  t.is(cars.length, 1)
  t.true(bytesEqual(bytes, await collectBytes(cars[0])))
})

test('bad target size', t => {
  t.throws(() => new Carbites(null, -1))
})
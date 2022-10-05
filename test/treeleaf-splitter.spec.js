import test from 'ava'
import { CarReader } from '@ipld/car'
import * as Block from 'multiformats/block'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import * as cbor from '@ipld/dag-cbor'
import * as json from '@ipld/dag-json'
import * as pb from '@ipld/dag-pb'
import { Blob } from '@web-std/blob'
import { collect, collectBytes, randomCar, toAsyncIterable } from './_helpers.js'
import { TreeleafCarSplitter } from '../lib/treeleaf/splitter.js'

const decoders = new Map([raw, cbor, json, pb].map(d => [d.code, d]))

const empty = CID.parse('bafkqaaa')

test('split in ~two', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = new TreeleafCarSplitter(await CarReader.fromBytes(bytes), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
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
  const splitter = new TreeleafCarSplitter(await CarReader.fromBytes(bytes), Infinity)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.is(cars.length, 2, 'treeleaf always splits tree from leaf nodes')

  const treeCar = await CarReader.fromIterable(cars[0])
  for await (const { cid, bytes } of treeCar.blocks()) {
    const codec = decoders.get(cid.code)
    const decoded = Block.createUnsafe({ cid, bytes, codec })
    t.true(Array.from(decoded.links()).length > 0, 'All blocks in tree car should have links')
  }

  const leafCar = await CarReader.fromIterable(cars[1])
  for await (const { cid, bytes } of leafCar.blocks()) {
    const codec = decoders.get(cid.code)
    const decoded = Block.createUnsafe({ cid, bytes, codec })
    t.is(Array.from(decoded.links()).length, 0, 'All blocks in leaf car should have no links')
  }
})

test('roots in first CAR, empty CID root in other CARs', async t => {
  const targetSize = 100
  const bytes = await collectBytes(await randomCar(1000))
  const splitter = new TreeleafCarSplitter(await CarReader.fromBytes(bytes), targetSize)
  let i = 0
  for await (const car of splitter.cars()) {
    const reader = await CarReader.fromIterable(car)
    const roots = await reader.getRoots()
    if (i === 0) {
      t.true(roots.length > 0)
    } else {
      t.is(roots.length, 1)
      t.true(empty.equals(roots[0]))
    }
    i++
  }
})

test('bad target size', t => {
  t.throws(() => new TreeleafCarSplitter(null, -1))
})

test('split CARs are RootsReader', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const reader = await CarReader.fromBytes(bytes)
  const splitter = new TreeleafCarSplitter(reader, targetSize)
  const splitRoots = []
  for await (const car of splitter.cars()) {
    const roots = await car.getRoots()
    splitRoots.push(...roots)
  }
  const originRoots = await reader.getRoots()
  for (const [i, r] of originRoots.entries()) {
    t.true(r.equals(splitRoots[i]))
  }
  // non-origin roots should be empty CID
  splitRoots.slice(originRoots.length).forEach(r => {
    t.true(r.equals(empty))
  })
})

test('fromBlob', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = await TreeleafCarSplitter.fromBlob(new Blob([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
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

test('fromIterable', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = await TreeleafCarSplitter.fromIterable(toAsyncIterable([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
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

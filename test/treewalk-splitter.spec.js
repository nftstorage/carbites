import test from 'ava'
import { CarReader } from '@ipld/car'
import { Blob } from '@web-std/blob'
import { bytesEqual, collect, collectBytes, randomCar, toAsyncIterable } from './_helpers.js'
import { TreewalkCarSplitter } from '../lib/treewalk/splitter.js'

test('split in ~two', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = new TreewalkCarSplitter(await CarReader.fromBytes(bytes), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.true(cars.length >= 2, `${cars.length} >= 2`)
  const chunkedBlocks = new Map()
  for (const c of cars) {
    const reader = await CarReader.fromIterable(c)
    for await (const b of reader.blocks()) {
      chunkedBlocks.set(b.cid.toString(), b)
    }
  }
  t.is(blocks.length, chunkedBlocks.size)
})

test('target size bigger than file size', async t => {
  const bytes = await collectBytes(await randomCar(1000))
  const splitter = new TreewalkCarSplitter(await CarReader.fromBytes(bytes), Infinity)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.is(cars.length, 1)
  t.true(bytesEqual(bytes, await collectBytes(cars[0])))
})

test('same root in every CAR', async t => {
  const targetSize = 100
  const bytes = await collectBytes(await randomCar(1000))
  const reader = await CarReader.fromBytes(bytes)
  const [rootCid] = await reader.getRoots()
  const splitter = new TreewalkCarSplitter(reader, targetSize)
  for await (const car of splitter.cars()) {
    const reader = await CarReader.fromIterable(car)
    const roots = await reader.getRoots()
    t.is(roots.length, 1)
    t.true(rootCid.equals(roots[0]))
  }
})

test('bad target size', t => {
  t.throws(() => new TreewalkCarSplitter(null, -1))
})

test('fromBlob', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = await TreewalkCarSplitter.fromBlob(new Blob([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.true(cars.length >= 2)
  const chunkedBlocks = new Map()
  for (const c of cars) {
    const reader = await CarReader.fromIterable(c)
    for await (const b of reader.blocks()) {
      chunkedBlocks.set(b.cid.toString(), b)
    }
  }
  t.is(blocks.length, chunkedBlocks.size)
})

test('fromIterable', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = await TreewalkCarSplitter.fromIterable(toAsyncIterable([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.true(cars.length >= 2)
  const chunkedBlocks = new Map()
  for (const c of cars) {
    const reader = await CarReader.fromIterable(c)
    for await (const b of reader.blocks()) {
      chunkedBlocks.set(b.cid.toString(), b)
    }
  }
  t.is(blocks.length, chunkedBlocks.size)
})

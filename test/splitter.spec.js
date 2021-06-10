import test from 'ava'
import { CarReader } from '@ipld/car'
import * as dagCbor from '@ipld/dag-cbor'
import { bytesEqual, collect, collectBytes, randomCar, toAsyncIterable } from './_helpers.js'
import { CarSplitter } from '../index.js'
import { RootedCarSplitter } from '../rooted/index.js'

test('split in ~two', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = new CarSplitter(toAsyncIterable([bytes]), targetSize)
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
  const splitter = new CarSplitter(toAsyncIterable([bytes]), Infinity)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.is(cars.length, 1)
  t.true(bytesEqual(bytes, await collectBytes(cars[0])))
})

test('only roots in first car', async t => {
  const targetSize = 100
  const bytes = await collectBytes(await randomCar(1000))
  const splitter = new CarSplitter(toAsyncIterable([bytes]), targetSize)
  let i = 0
  for await (const car of splitter.cars()) {
    const reader = await CarReader.fromIterable(car)
    const roots = await reader.getRoots()
    if (i === 0) {
      t.true(roots.length > 0)
    } else {
      t.is(roots.length, 0)
    }
    i++
  }
  t.true(i > 1)
})

test('bad target size', t => {
  t.throws(() => new CarSplitter(null, -1))
})

test('root nodes', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const blocks = await collect((await CarReader.fromBytes(bytes)).blocks())
  const splitter = new RootedCarSplitter(toAsyncIterable([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  t.true(cars.length >= 2)
  const chunkedBlocks = []
  for (const c of cars) {
    const bs = await collect((await CarReader.fromIterable(c)).blocks())
    const root = dagCbor.decode(bs[0].bytes)
    t.true(Array.isArray(root))
    t.is(root.length, 3)
    t.is(root[0], '/carbites/1')
    t.true(Array.isArray(root[1]))
    t.true(Array.isArray(root[2]))
    chunkedBlocks.push(...bs.slice(1))
  }
  t.is(blocks.length, chunkedBlocks.length)
})

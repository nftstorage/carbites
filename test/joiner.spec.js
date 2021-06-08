import test from 'ava'
import { bytesEqual, collectBytes, randomCar, toAsyncIterable } from './_helpers.js'
import { CarSplitter, CarJoiner } from '../index.js'
import { RootedCarSplitter, RootedCarJoiner } from '../rooted/index.js'

test('joins CARs', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const splitter = new CarSplitter(toAsyncIterable([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  const joiner = new CarJoiner(cars)
  t.true(bytesEqual(await collectBytes(joiner.car()), bytes))
})

test('joins rooted CARs', async t => {
  const targetSize = 500
  const bytes = await collectBytes(await randomCar(1000))
  const splitter = new RootedCarSplitter(toAsyncIterable([bytes]), targetSize)
  const cars = []
  for await (const car of splitter.cars()) {
    cars.push(car)
  }
  const joiner = new RootedCarJoiner(cars)
  t.true(bytesEqual(await collectBytes(joiner.car()), bytes))
})

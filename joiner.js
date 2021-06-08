import { CarBlockIterator, CarWriter } from '@ipld/car'

export class CarJoiner {
  /**
   * @param {Iterable<AsyncIterable<Uint8Array>>} cars
   */
  constructor (cars) {
    this._cars = Array.from(cars)
    if (!this._cars.length) throw new Error('missing CARs')
  }

  async * car () {
    const firstCar = this._cars[0]
    const reader = await CarBlockIterator.fromIterable(firstCar)
    const roots = await reader.getRoots()
    const { writer, out } = CarWriter.create(roots)
    const writeCar = async () => {
      try {
        for await (const b of reader) {
          await writer.put(b)
        }
        for (const c of this._cars.slice(1)) {
          const reader = await CarBlockIterator.fromIterable(c)
          for await (const b of reader) {
            await writer.put(b)
          }
        }
      } catch (err) {
        console.error(err) // TODO: how to forward this on?
      } finally {
        await writer.close()
      }
    }

    writeCar()
    yield * out
  }
}

import { CarBlockIterator, CarWriter } from '@ipld/car'

export class CarSplitter {
  /**
   * @param {AsyncIterable<Uint8Array>} car
   * @param {number} targetSize
   */
  constructor (car, targetSize) {
    if (typeof targetSize !== 'number' || targetSize <= 0) {
      throw new Error('invalid target chunk size')
    }
    this._car = car
    this._targetSize = targetSize
  }

  async * cars () {
    const reader = await CarBlockIterator.fromIterable(this._car)
    const allBlocks = reader[Symbol.asyncIterator]()
    const roots = await reader.getRoots()
    let blocks = []
    let size = 0
    let first = true
    let finished = false

    while (!finished) {
      while (size < this._targetSize) {
        const { done, value: block } = await allBlocks.next()
        if (done) {
          finished = true
          break
        }
        blocks.push(block)
        size += block.bytes.length
      }
      const { writer, out } = CarWriter.create(first ? roots : [])
      blocks.forEach(b => writer.put(b))
      writer.close()
      yield out
      blocks = []
      size = 0
      first = false
    }
  }
}

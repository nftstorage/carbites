import { CarWriter } from '@ipld/car'

export class Carbites {
  /**
   * @param {import('@ipld/car').CarReader} reader
   * @param {number} targetSize
   */
  constructor (reader, targetSize) {
    if (typeof targetSize !== 'number' || targetSize <= 0) {
      throw new Error('invalid target chunk size')
    }
    this._reader = reader
    this._targetSize = targetSize
  }

  async * cars () {
    const allBlocks = this._reader.blocks()
    let roots = await this._reader.getRoots()
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
        if (!first) roots.push(block.cid)
        blocks.push(block)
        size += block.bytes.length
      }
      const { writer, out } = CarWriter.create(roots)
      blocks.forEach(b => writer.put(b))
      writer.close()
      yield out
      roots = []
      blocks = []
      size = 0
      first = false
    }
  }
}
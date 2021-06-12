import { CarBlockIterator, CarWriter } from '@ipld/car'
import { CID } from 'multiformats/cid'

/**
 * A work-around for use-cases where the inclusion of a root CID is difficult
 * but needing to be safely within the "at least one" recommendation is to use
 * an empty CID: \x01\x55\x00\x00 (zero-length "identity" multihash with "raw"
 * codec). Since current implementations for this version of the CAR
 * specification don't check for the existence of root CIDs (see Root CID block
 * existence), this will be safe as far as CAR implementations are concerned.
 * However, there is no guarantee that applications that use CAR files will
 * correctly consume (ignore) this empty root CID.
 *
 * https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md#number-of-roots
 */
const empty = CID.parse('bafkqaaa')

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
      const { writer, out } = CarWriter.create(first ? roots : [empty])
      blocks.forEach(b => writer.put(b))
      writer.close()
      yield out
      blocks = []
      size = 0
      first = false
    }
  }
}

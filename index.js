import { CarWriter } from '@ipld/car'
import { mkRootNode } from './root-node.js'

/**
 * @typedef {import('multiformats/cid').CID} CID
 * @typedef {import('multiformats/block').Block} Block
 */

export class CarBiter {
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
    const roots = await this._reader.getRoots()
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

export class RootedCarBiter extends CarBiter {
  async * cars () {
    const allBlocks = this._reader.blocks()
    const roots = await this._reader.getRoots()
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
      const root = await mkRootNode(first ? roots : blocks.map(b => b.cid))
      const { writer, out } = CarWriter.create(root.cid)
      writer.put(root)
      blocks.forEach(b => writer.put(b))
      writer.close()
      yield out
      blocks = []
      size = 0
      first = false
    }
  }
}

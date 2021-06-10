import { CarBlockIterator, CarWriter } from '@ipld/car'
import { mkRootNode } from './root-node.js'
import { CarSplitter } from '../splitter.js'

export class RootedCarSplitter extends CarSplitter {
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
      const root = await mkRootNode(first ? roots : [], blocks.map(b => b.cid))
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

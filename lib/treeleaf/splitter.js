import { CarReader, CarWriter } from '@ipld/car'
import * as Block from 'multiformats/block'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import * as cbor from '@ipld/dag-cbor'
import * as json from '@ipld/dag-json'
import * as pb from '@ipld/dag-pb'

/**
 * @typedef {import('@ipld/car/api').BlockReader & import('@ipld/car/api').RootsReader} ICarReader
 * @typedef {import('@ipld/car/api').WriterChannel} WriterChannel
 * @typedef {import('multiformats/codecs/interface').BlockDecoder<any, any>} BlockDecoder
 * @typedef {{ decoders?: BlockDecoder[] }} Options
 * @typedef {number} Code
 */

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

export class TreeleafCarSplitter {
  /**
   * @param {ICarReader} reader
   * @param {number} targetSize
   * @param {Options} [options]
   */
  constructor (reader, targetSize, options = {}) {
    if (typeof targetSize !== 'number' || targetSize <= 0) {
      throw new Error('invalid target chunk size')
    }
    this._reader = reader
    this._targetSize = targetSize
    const codecs = [pb, raw, cbor, json, ...(options.decoders || [])]
    /** @type Map<Code, BlockDecoder> */
    this._decoderMap = new Map(codecs.map(d => [d.code, d]))
  }

  async * cars () {
    /** @type {(roots?: CID[]) => WriterChannel} */
    const createCarWriter = (roots = [empty]) => {
      const car = CarWriter.create(roots)
      Object.assign(car.out, { version: 1, getRoots: async () => roots })
      return car
    }
    const leaves = []
    const originRoots = await this._reader.getRoots()
    const tree = createCarWriter(originRoots)

    for await (const block of this._reader.blocks()) {
      if (block.cid.code === raw.code) {
        leaves.push(block)
        continue
      }
      const codec = this._decoderMap.get(block.cid.code)
      if (!codec) throw new Error(`missing decoder for ${block.cid.code}`)
      const decoded = Block.createUnsafe({ cid: block.cid, bytes: block.bytes, codec })
      const hasLinks = Array.from(decoded.links()).length > 0
      if (hasLinks) {
        tree.writer.put(block)
      } else {
        leaves.push(block)
      }
    }
    tree.writer.close()
    yield tree.out

    // finished tree car, now write multiple leaf cars

    let size = 0
    let car = createCarWriter()
    for (const block of leaves) {
      if (size >= this._targetSize) {
        car.writer.close()
        yield car.out
        car = createCarWriter()
      }
      car.writer.put(block)
      size += block.bytes.length
    }
    car.writer.close()
    yield car.out
  }

  /**
   * @param {Blob} blob
   * @param {number} targetSize
   */
  static async fromBlob (blob, targetSize) {
    const buffer = await blob.arrayBuffer()
    const reader = await CarReader.fromBytes(new Uint8Array(buffer))
    return new TreeleafCarSplitter(reader, targetSize)
  }

  /**
   * @param {AsyncIterable<Uint8Array>} iterable
   * @param {number} targetSize
   */
  static async fromIterable (iterable, targetSize) {
    const reader = await CarReader.fromIterable(iterable)
    return new TreeleafCarSplitter(reader, targetSize)
  }
}

import { CarWriter } from '@ipld/car'
import * as dagCbor from '@ipld/dag-cbor'
import { garbage } from 'ipld-garbage'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'

/**
 * @param {number} min
 * @param {number} max
 */
function randomInt (min, max) {
  return Math.random() * (max - min) + min
}

/**
 * @param {number} targetSize
 * @returns {Promise<AsyncIterable<Uint8Array>>}
 */
export async function randomCar (targetSize) {
  const blocks = []
  let size = 0
  while (size < targetSize) {
    const bytes = dagCbor.encode(garbage(randomInt(1, targetSize)))
    const hash = await sha256.digest(bytes)
    const cid = CID.create(1, dagCbor.code, hash)
    blocks.push({ cid, bytes })
    size += bytes.length
  }
  const { writer, out } = CarWriter.create(blocks.map(b => b.cid))
  blocks.forEach(b => writer.put(b))
  writer.close()
  return out
}

/**
 * @template T
 * @param {AsyncIterable<T>} iterable
 * @returns {Promise<Array<T>>}
 */
export async function collect (iterable) {
  const chunks = []
  for await (const chunk of iterable) {
    chunks.push(chunk)
  }
  return chunks
}

/**
 * @param {AsyncIterable<Uint8Array>} iterable
 * @returns {Promise<Uint8Array>}
 */
export async function collectBytes (iterable) {
  const chunks = await collect(iterable)
  return new Uint8Array([].concat(...chunks.map(c => Array.from(c))))
}

/**
 * @param {Uint8Array} b0
 * @param {Uint8Array} b1
 */
export function bytesEqual (b0, b1) {
  return b0.length === b1.length && b0.every((v, i) => v === b1[i])
}

/**
 * @template T
 * @param {Iterable<T>} iterable
 * @returns {AsyncIterable<T>}
 */
export function toAsyncIterable (iterable) {
  return (async function * () {
    for (const item of iterable) {
      yield item
    }
  })()
}

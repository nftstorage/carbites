import { encode, code } from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { Block } from 'multiformats/block'

/** @typedef {['/carbites/1', CID[]]} RootNode */

const MAX_SIZE = 1024 * 1024 * 4

/**
 * @param {Iterable<import('multiformats/cid').CID>} children
 * @returns {Promise<import('multiformats/block').Block<RootNode>}
 */
export async function mkRootNode (children) {
  /** @type {RootNode} */
  const value = ['/carbites/1', Array.from(children)]
  const bytes = encode(value)
  // FIXME: Given a V1 CID of ~36 bytes and the default IPFS chunk size of
  // 262,144 bytes you'd need to be splitting at 30GiB or more to experience
  // this error.
  if (bytes.length >= MAX_SIZE) {
    throw new Error('root node too big. The root node is bigger than 4MiB: the biggest message IPFS will bitswap. Split the CAR into smaller chunks.')
  }
  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, code, hash)
  return new Block({ cid, bytes, value })
}

/**
 * @param {any} node
 * @returns {boolean}
 */
export function isRootNode (node) {
  if (!Array.isArray(node)) return false
  if (node.length !== 2) return false
  if (node[0] !== '/carbites/1') return false
  if (!Array.isArray(node[1])) return false
  return true
}

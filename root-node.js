import { encode, code } from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import { Block } from 'multiformats/block'

/**
 * @param {Iterable<import('multiformats/cid').CID>} children
 * @returns {Promise<import('multiformats/block').Block>}
 */
export async function mkRootNode (children) {
  const value = ['/carbites/1', Array.from(children)]
  const bytes = encode(value)
  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, code, hash)
  return new Block({ cid, bytes, value })
}

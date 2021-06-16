import { BlockDecoder } from 'multiformats/codecs/interface'
import { CarReader } from '@ipld/car'
import { SimpleCarSplitter } from '../simple/splitter.js'

export type Options = { decoders: BlockDecoder[] }

export class TreewalkCarSplitter extends SimpleCarSplitter {
  /**
   * Create a new CAR file splitter.
   * @param reader The CAR file to split into smaller CARs.
   * @param targetSize Target size in bytes to chunk CARs to.
   */
  constructor (reader: CarReader, targetSize: number, options?: Options)
  /**
   * Convenience function to create a new `TreewalkCarSplitter` from a
   * [blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of CAR file
   * data.
   */
  static async fromBlob(blob: Blob, targetSize: number, options?: Options): TreewalkCarSplitter
  /**
   * Convenience function to create a new `TreewalkCarSplitter` from an async
   * iterable of CAR file data.
   */
   static async fromIterable(iterable: Blob, targetSize: number, options?: Options): TreewalkCarSplitter
}

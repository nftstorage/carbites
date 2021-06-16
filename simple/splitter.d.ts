import { CarReader } from '@ipld/car'

export class SimpleCarSplitter {
  /**
   * Create a new CAR file splitter.
   * @param reader The CAR file to split into smaller CARs.
   * @param targetSize Target size in bytes to chunk CARs to.
   */
  constructor (reader: CarReader, targetSize: number)
  /**
   * Chunk the CAR into multiple CAR files of around targetSize bytes.
   */
  cars (): AsyncGenerator<AsyncIterable<Uint8Array>>
  /**
   * Convenience function to create a new `CarSplitter` from a
   * [blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of CAR file
   * data.
   */
  static async fromBlob(blob: Blob, targetSize: number): SimpleCarSplitter
  /**
   * Convenience function to create a new `SimpleCarSplitter` from an async
   * iterable of CAR file data.
   */
   static async fromIterable(iterable: Blob, targetSize: number): SimpleCarSplitter
}

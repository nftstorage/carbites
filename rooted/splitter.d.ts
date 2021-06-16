import { SimpleCarSplitter } from '../simple/splitter.js'
export class RootedCarSplitter extends SimpleCarSplitter {
  /**
   * Convenience function to create a new `RootedCarSplitter` from a
   * [blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of CAR file
   * data.
   */
  static async fromBlob(blob: Blob, targetSize: number): RootedCarSplitter
  /**
   * Convenience function to create a new `RootedCarSplitter` from an async
   * iterable of CAR file data.
   */
  static async fromIterable(iterable: Blob, targetSize: number): RootedCarSplitter
}

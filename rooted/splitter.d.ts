import { CarSplitter } from '../splitter.js'
export class RootedCarSplitter extends CarSplitter {
  /**
   * Convenience function to create a new `RootedCarSplitter` from a
   * [blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) of CAR file
   * data.
   */
  static fromBlob(blob: Blob, targetSize: number): RootedCarSplitter
}

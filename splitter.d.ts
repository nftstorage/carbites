import { RootsReader } from '@ipld/car/api'

export class CarSplitter {
  /**
   * Create a new CAR file splitter.
   * @param car The CAR file to split into smaller CARs.
   * @param targetSize Target size in bytes to chunk CARs to.
   */
  constructor (car: AsyncIterable<Uint8Array>, targetSize: number)
  /**
   * Chunk the CAR into multiple CAR files of around targetSize bytes.
   */
  cars (): AsyncGenerator<AsyncIterable<Uint8Array> & RootsReader>
}

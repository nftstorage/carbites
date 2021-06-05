import { CarReader } from '@ipld/car'

export class CarBiter {
  /**
   * Create a new CAR file chunker.
   * @param reader The CAR file to chunk into smaller CARs.
   * @param targetSize Target size in bytes to chunk CARs to.
   */
  constructor (reader: CarReader, targetSize: number)
  /**
   * Chunk the CAR into multiple CAR files of around targetSize bytes.
   */
  cars (): AsyncGenerator<AsyncIterable<Uint8Array>>
}

export class RootedCarBiter extends CarBiter {}

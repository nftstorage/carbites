import { CarReader } from '@ipld/car'

export class SimpleCarJoiner {
  /**
   * Create a new CAR file joiner.
   * @param cars The CAR files to join into a single CAR.
   */
  constructor (cars: Iterable<CarReader>)
  /**
   * Join the CAR files into a single CAR.
   */
  car (): AsyncGenerator<Uint8Array>
}

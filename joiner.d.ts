export class CarJoiner {
  /**
   * Create a new CAR file joiner.
   * @param cars The CAR files to join into a single CAR.
   */
  constructor (cars: Iterable<AsyncIterable<Uint8Array>>)
  /**
   * Join the CAR files into a single CAR.
   */
  car (): AsyncGenerator<Uint8Array>
}
export interface PhotoFileStorage {
  /** Copy a picker-provided temporary path into local persistent app storage. */
  save(tempFilePath: string): Promise<string>
}

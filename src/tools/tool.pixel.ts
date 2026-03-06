/**
 * Pixel Generator Tool
 * Generates pixels on the official server when the CPU bucket is full.
 */
export default class ToolPixel {
  /**
   * Runs the pixel generation logic.
   * Checks if the current server is the official one and if the bucket is at its limit.
   */
  public static run(): void {
    // Check if we are on the official server (shards start with 'shard')
    // and if the generatePixel function exists in the environment.
    const isOfficialServer = Game.shard.name.startsWith('shard');
    
    if (isOfficialServer && typeof Game.cpu.generatePixel === 'function') {
      if (Game.cpu.bucket >= 10000) {
        const result = Game.cpu.generatePixel();
        if (result === OK) {
          console.log('[Pixel] Successfully generated 1 pixel.');
        }
      }
    }
  }
}

import { fromUrl, GeoTIFFImage } from "geotiff";

/**
 * Reads small pixel windows from Cloud Optimized GeoTIFFs over HTTPS.
 * Only the needed byte ranges are downloaded, not the whole tile.
 * Opened images are cached per URL; a missing tile (404) is cached as null.
 */
export class CogReader {
  private readonly images = new Map<string, Promise<GeoTIFFImage | null>>();

  private open(url: string): Promise<GeoTIFFImage | null> {
    let image = this.images.get(url);
    if (!image) {
      image = fromUrl(url)
        .then((tiff) => tiff.getImage())
        .catch((err: unknown) => {
          if (String(err).includes("404")) return null;
          this.images.delete(url); // network error: retry next time
          throw err;
        });
      this.images.set(url, image);
    }
    return image;
  }

  /**
   * Returns a size×size window centred on the pixel that contains the point,
   * plus the pixel size in degrees. The window is shifted inward at tile edges.
   */
  async readWindow(
    url: string,
    lat: number,
    lon: number,
    size: number,
  ): Promise<{ values: number[]; resX: number; resY: number } | null> {
    const image = await this.open(url);
    if (!image) return null;

    const [minX, minY, maxX, maxY] = image.getBoundingBox() as [
      number,
      number,
      number,
      number,
    ];
    const width = image.getWidth();
    const height = image.getHeight();

    // x grows with longitude, but image rows grow downward while latitude grows upward
    const px = Math.floor(((lon - minX) / (maxX - minX)) * width);
    const py = Math.floor(((maxY - lat) / (maxY - minY)) * height);

    const half = Math.floor(size / 2);
    const x0 = Math.min(Math.max(px - half, 0), width - size);
    const y0 = Math.min(Math.max(py - half, 0), height - size);

    const rasters = await image.readRasters({
      window: [x0, y0, x0 + size, y0 + size],
    });
    const band = rasters[0] as ArrayLike<number>;

    return {
      values: Array.from(band),
      resX: (maxX - minX) / width,
      resY: (maxY - minY) / height,
    };
  }
}

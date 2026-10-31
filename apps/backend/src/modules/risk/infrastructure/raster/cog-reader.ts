import { fromUrl, GeoTIFFImage } from "geotiff";

type OpenImage = {
  image: GeoTIFFImage;
  /** [minLon, minLat, maxLon, maxLat] of the tile */
  bbox: [number, number, number, number];
};

/**
 * Reads small pixel windows from Cloud Optimized GeoTIFFs over HTTPS.
 * Only the needed byte ranges are downloaded, not the whole tile.
 * Opened images are cached per URL and overview; a missing tile is cached as null.
 */
export class CogReader {
  private readonly images = new Map<string, Promise<OpenImage | null>>();

  /** overview 0 = full resolution, 1 = half, 2 = quarter, ... */
  private open(url: string, overview: number): Promise<OpenImage | null> {
    const key = `${overview}|${url}`;
    let image = this.images.get(key);
    if (!image) {
      image = (async () => {
        // S3 answers 403/404 for tiles that do not exist (open sea, excluded areas)
        const head = await fetch(url, { method: "HEAD" });
        if (head.status === 403 || head.status === 404) return null;
        const tiff = await fromUrl(url);
        // overview images carry no georeferencing; the full-resolution one does
        const bbox = (await tiff.getImage(0)).getBoundingBox() as OpenImage["bbox"];
        return { image: await tiff.getImage(overview), bbox };
      })().catch((err: unknown) => {
        this.images.delete(key); // network error: retry next time
        throw err;
      });
      this.images.set(key, image);
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
    overview = 0,
  ): Promise<{ values: number[]; resX: number; resY: number } | null> {
    const opened = await this.open(url, overview);
    if (!opened) return null;

    const { image } = opened;
    const [minX, minY, maxX, maxY] = opened.bbox;
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

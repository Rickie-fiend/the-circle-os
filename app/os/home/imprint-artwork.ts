export type ArtworkAsset = { path: string; hash: string; type?: string };

export async function checkedArtwork(asset: ArtworkAsset) {
  const response = await fetch(`/${asset.path}?v=${asset.hash}`);
  if (!response.ok) throw Error('Artwork data is unavailable.');
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  if (actual !== asset.hash) throw Error('Artwork data did not match its inspection.');
  return bytes;
}

export async function decodeArtwork(bytes: ArrayBuffer, type: string) {
  const bitmap = await createImageBitmap(new Blob([bytes], { type }));
  try {
    const scratch = document.createElement('canvas');
    scratch.width = bitmap.width;
    scratch.height = bitmap.height;
    const context = scratch.getContext('2d');
    if (!context) throw Error('Canvas is unavailable.');
    context.drawImage(bitmap, 0, 0);
    return context.getImageData(0, 0, scratch.width, scratch.height);
  } finally {
    bitmap.close();
  }
}

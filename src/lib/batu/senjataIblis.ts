// Shim kompatibilitas Three.js untuk tombak iblis (RONDE 14) — file ini
// BUKAN kode spear (kode spear verbatim ada di tombakIblis.ts).
//
// Masalah: aset spear ditulis untuk Three.js r128, sedangkan game memakai
// three 0.187. Satu-satunya API r128 yang hilang di 0.187 di dalam kode
// spear adalah `THREE.sRGBEncoding` (dihapus sejak r152, diganti
// `texture.colorSpace = THREE.SRGBColorSpace`). Kode spear memanggil:
//   t.encoding = THREE.sRGBEncoding   (di makeTex, 2x, guard isSRGB)
// Solusi TANPA mengedit kode spear: panggil fungsi spear dengan objek
// THREE kompatibel — spread semua export three 0.187, timpa dua hal:
//   1. `sRGBEncoding` -> THREE.SRGBColorSpace (konstanta pengganti).
//   2. `CanvasTexture` -> subclass yang memetakan setter `encoding`
//      ke `colorSpace` (karena Texture 0.187 tidak lagi punya properti
//      `encoding` — tanpa subclass ini, penugasan encoding hanya jadi
//      properti liar yang diabaikan renderer dan tekstur tampil linear).
// Semua pemakaian THREE lain di kode spear (Group, MeshStandardMaterial,
// BufferGeometry, CylinderGeometry, TorusGeometry, PointsMaterial,
// PointLight, dsb.) masih ada di 0.187 — nol shim tambahan.
import * as THREE from "three";
import createCrimsonDemonicSpear from "./tombakIblis";

class CanvasTextureCompat extends THREE.CanvasTexture {
  set encoding(v: unknown) {
    this.colorSpace =
      v === (THREE as unknown as Record<string, unknown>).SRGBColorSpace
        ? THREE.SRGBColorSpace
        : THREE.NoColorSpace;
  }
  get encoding(): unknown {
    return this.colorSpace;
  }
}

// Objek THREE untuk kode spear: semua export 0.187 + 2 tambalan di atas.
export const THREE_SPEAR: Record<string, unknown> = {
  ...THREE,
  CanvasTexture: CanvasTextureCompat,
  sRGBEncoding: THREE.SRGBColorSpace,
};

/** Bangun SATU grup tombak iblis (tekstur prosedural dibuat di dalamnya).
 *  Dipanggil sekali per pembuatan mesh Figo (mesh warga persisten, bukan
 *  per poll) — bukan per frame. */
export function buatTombakIblis(): THREE.Group {
  return createCrimsonDemonicSpear(
    THREE_SPEAR as unknown as typeof THREE,
  ) as unknown as THREE.Group;
}

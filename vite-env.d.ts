/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // เพิ่มตัวแปรอื่น ๆ ที่นี่ ถ้ามี
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
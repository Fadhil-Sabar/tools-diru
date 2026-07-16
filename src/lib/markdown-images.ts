export const IMAGE_REF_PREFIX = 'mdvibe://img/'
const IMAGE_REF_PATTERN = /mdvibe:\/\/img\/([a-f0-9]{12})/g
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const DB_NAME = 'daily-tools-markdown-images'
const STORE_NAME = 'images'

interface ImageRecord {
  id: string
  blob: Blob
  name: string
  createdAt: number
}

let databasePromise: Promise<IDBDatabase> | null = null

function database() {
  if (databasePromise) return databasePromise
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return databasePromise
}

function imageId() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 12)
}

export function imageIds(markdown: string) {
  const ids = new Set<string>()
  for (const match of markdown.matchAll(IMAGE_REF_PATTERN)) ids.add(match[1])
  return [...ids]
}

export async function storeMarkdownImage(file: Blob, name: string) {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 10 MB or smaller.')
  const db = await database()
  const id = imageId()
  const record: ImageRecord = { id, blob: file, name, createdAt: Date.now() }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  return id
}

export async function getMarkdownImage(id: string) {
  const db = await database()
  return new Promise<ImageRecord | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve((request.result as ImageRecord | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

function blobDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function inlineMarkdownImages(markdown: string) {
  let portable = markdown
  for (const id of imageIds(markdown)) {
    const image = await getMarkdownImage(id)
    if (image) portable = portable.replaceAll(`${IMAGE_REF_PREFIX}${id}`, await blobDataUrl(image.blob))
  }
  return portable
}

const DATA_IMAGE_PATTERN = /data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)/gi

export async function internalizeDataImages(markdown: string) {
  let result = markdown
  const unique = [...new Set(markdown.match(DATA_IMAGE_PATTERN) ?? [])]
  for (const dataUrl of unique) {
    const [metadata, encoded] = dataUrl.split(',')
    const type = metadata.slice(5, metadata.indexOf(';'))
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const blob = new Blob([bytes], { type })
    if (blob.size > MAX_IMAGE_BYTES) continue
    const id = await storeMarkdownImage(blob, 'embedded-image')
    result = result.replaceAll(dataUrl, `${IMAGE_REF_PREFIX}${id}`)
  }
  return result
}

export async function createImageUrlMap(markdown: string) {
  const urls = new Map<string, string>()
  await Promise.all(imageIds(markdown).map(async (id) => {
    const image = await getMarkdownImage(id)
    if (image) urls.set(id, URL.createObjectURL(image.blob))
  }))
  return urls
}

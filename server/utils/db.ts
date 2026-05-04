import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

function extractDatabaseName(uri: string): string | null {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)
  if (!match || !match[1]) {
    return null
  }

  const name = decodeURIComponent(match[1]).trim().replace(/\/$/, '')
  return name || null
}

function isTlsInternalHandshakeError(message: string): boolean {
  return /tlsv1 alert internal error|SSL alert number 80/i.test(message)
}

export async function connectDB(): Promise<Db> {
  if (db) {
    return db
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    const dbName = process.env.MONGODB_DB_NAME?.trim() || extractDatabaseName(uri) || 'ghostform'
    const shouldForceTls = uri.startsWith('mongodb+srv://') && !/[?&]tls=/i.test(uri)

    client = new MongoClient(uri, {
      tls: shouldForceTls ? true : undefined,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      retryReads: true,
      retryWrites: true,
      maxPoolSize: 10
    })
    await client.connect()
    db = client.db(dbName)
    return db
  } catch (error: any) {
    const rawMessage = error?.message || String(error)
    const hint = isTlsInternalHandshakeError(rawMessage)
      ? ' TLS handshake failed. Verify Atlas URI uses mongodb+srv://, Node runtime is 18+ (prefer 20), and Atlas network access includes your deploy egress IP.'
      : ''

    console.error('MongoDB connection error:', rawMessage)
    throw new Error(`Failed to connect to MongoDB: ${rawMessage}${hint}`)
  }
}

export async function getCollection(name: string) {
  const database = await connectDB()
  const collection = database.collection(name)
  
  if (name === 'forms') {
    try {
      await collection.createIndex({ slug: 1 }, { unique: true })
    } catch (error) {
    }
  }
  
  if (name === 'submissions') {
    try {
      await collection.createIndex({ formSlug: 1, clientIP: 1, createdAt: -1 })
    } catch (error) {
    }
  }
  
  return collection
}

export const collections = {
  users: () => getCollection('users'),
  forms: () => getCollection('forms'),
  submissions: () => getCollection('submissions'),
  sessions: () => getCollection('sessions'),
  otps: () => getCollection('otps')
}


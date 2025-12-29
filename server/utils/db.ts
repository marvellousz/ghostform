import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectDB(): Promise<Db> {
  if (db) {
    return db
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set')
  }

  try {
    // Extract database name from URI
    // URI format: mongodb+srv://user:pass@host/dbname?options
    // Find the part after the last '/' before '?'
    const match = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)
    let dbName = 'ghostform' // default
    
    if (match && match[1]) {
      dbName = match[1].trim()
      // Remove trailing slash if present
      dbName = dbName.replace(/\/$/, '')
    }
    
    // Ensure dbName is not empty
    if (!dbName) {
      dbName = 'ghostform'
    }
    
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    return db
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message)
    throw new Error(`Failed to connect to MongoDB: ${error.message}`)
  }
}

export async function getCollection(name: string) {
  const database = await connectDB()
  return database.collection(name)
}

// Collections
export const collections = {
  users: () => getCollection('users'),
  forms: () => getCollection('forms'),
  submissions: () => getCollection('submissions'),
  sessions: () => getCollection('sessions'),
  otps: () => getCollection('otps')
}


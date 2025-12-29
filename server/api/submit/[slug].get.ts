import { readFile, mkdir } from 'fs/promises'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), '.data')
const FORMS_FILE = join(DATA_DIR, 'forms.json')

async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

async function getForms() {
  await ensureDataDir()
  try {
    const data = await readFile(FORMS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const forms = await getForms()
  const form = forms.find((f: any) => f.slug === slug)

  if (!form) {
    throw createError({
      statusCode: 404,
      message: 'Form not found'
    })
  }

  // Return HTML form page
  return sendRedirect(event, `/form/${slug}`)
})


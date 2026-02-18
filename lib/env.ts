import { z } from "zod"

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
})

const parsedEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => issue.message).join("; ")
  throw new Error(`Invalid client environment: ${issues}`)
}

export const env = parsedEnv.data

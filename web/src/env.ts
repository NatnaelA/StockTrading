import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_IEX_API_KEY: z.string().min(1, 'IEX API key is required'),
});

export const env = {
  NEXT_PUBLIC_IEX_API_KEY: process.env.NEXT_PUBLIC_IEX_API_KEY ?? '',
};

// Validate environment variables
try {
  envSchema.parse(env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error);
  throw new Error('Invalid environment variables');
} 
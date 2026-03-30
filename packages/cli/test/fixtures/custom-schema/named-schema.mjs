import { z } from 'zod';

export const schema = z.object({ invoiceNumber: z.string(), total: z.number() });

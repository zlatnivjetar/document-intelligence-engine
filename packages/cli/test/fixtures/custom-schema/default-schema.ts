import { z } from 'zod';

export default z.object({ merchantName: z.string(), total: z.number() });

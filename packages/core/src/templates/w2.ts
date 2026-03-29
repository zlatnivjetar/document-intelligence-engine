import { z } from 'zod';

type W2SchemaShape = {
  employerName: z.ZodString;
  employerAddress: z.ZodNullable<z.ZodString>;
  employerEin: z.ZodNullable<z.ZodString>;
  employeeName: z.ZodString;
  employeeAddress: z.ZodNullable<z.ZodString>;
  employeeSsn: z.ZodNullable<z.ZodString>;
  taxYear: z.ZodString;
  wagesTipsOtherComp: z.ZodNumber;
  federalIncomeTaxWithheld: z.ZodNumber;
  stateWages: z.ZodNullable<z.ZodNumber>;
  stateTaxWithheld: z.ZodNullable<z.ZodNumber>;
  stateCode: z.ZodNullable<z.ZodString>;
};

const w2SchemaShape: W2SchemaShape = {
  employerName: z.string().describe('Employer name as shown on form'),
  employerAddress: z
    .string()
    .nullable()
    .describe('Employer address as printed, or null if not present'),
  employerEin: z
    .string()
    .nullable()
    .describe(
      'Employer Identification Number (EIN) - format XX-XXXXXXX, or null if not legible',
    ),
  employeeName: z.string().describe('Employee full name as shown on form'),
  employeeAddress: z
    .string()
    .nullable()
    .describe('Employee address as printed, or null if not present'),
  employeeSsn: z
    .string()
    .nullable()
    .describe(
      'Employee SSN as printed (often partially masked, e.g., XXX-XX-1234), or null',
    ),
  taxYear: z.string().describe('Tax year this W-2 covers (e.g., "2023")'),
  wagesTipsOtherComp: z
    .number()
    .describe('Box 1: Wages, tips, and other compensation in USD'),
  federalIncomeTaxWithheld: z
    .number()
    .describe('Box 2: Federal income tax withheld in USD'),
  stateWages: z
    .number()
    .nullable()
    .describe('Box 16: State wages, or null if not present'),
  stateTaxWithheld: z
    .number()
    .nullable()
    .describe('Box 17: State income tax withheld, or null if not present'),
  stateCode: z
    .string()
    .nullable()
    .describe(
      'Box 15: Two-letter state abbreviation (e.g., "CA"), or null if not present',
    ),
};

export const w2Schema: z.ZodObject<W2SchemaShape> = z.object(w2SchemaShape);

export type W2Data = z.infer<typeof w2Schema>;

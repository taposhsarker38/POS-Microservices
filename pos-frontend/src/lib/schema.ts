import z from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name must be 100 characters or less'),
  code: z.string().min(1, 'Company code is required').max(20, 'Company code must be 20 characters or less').regex(/^[A-Z0-9]+$/, 'Company code must be uppercase letters and numbers'),
  tax_number: z.string().optional(),
  vat_rate: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: 'VAT rate must be a valid number greater than or equal to 0',
  }),
  bin_number: z.string().optional(),
  default_payment_terms: z.string().optional(),
  address: z.string().optional(),
  accounting_codes: z.string().optional(),
});
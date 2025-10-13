import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string().email('Invalid email format');

// Password validation schema with enhanced security
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter'
  })
  .regex(/^(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter'
  })
  .regex(/^(?=.*\d)/, {
    message: 'Password must contain at least one number'
  })
  .regex(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
  })
  .refine((password) => {
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return !commonPasswords.includes(password.toLowerCase());
  }, {
    message: 'Password is too common. Please choose a stronger password'
  });

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Bonus for length
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Bonus for variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 1;

  const isStrong = score >= 4;
  
  if (score < 3) {
    feedback.push('Password is weak');
  } else if (score < 4) {
    feedback.push('Password is moderate');
  } else {
    feedback.push('Password is strong');
  }

  return { score, feedback, isStrong };
}

// Phone number validation (UK format)
export const phoneSchema = z
  .string()
  .regex(/^(\+44|0)[1-9]\d{1,4}\s?\d{3,4}\s?\d{3,4}$/, {
    message: 'Please enter a valid UK phone number'
  });

// UK postcode validation
export const postcodeSchema = z
  .string()
  .regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, {
    message: 'Please enter a valid UK postcode'
  });

// Enhanced input sanitization
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/expression\(/gi, '') // Remove CSS expressions
    .replace(/url\(/gi, '') // Remove CSS url()
    .replace(/eval\(/gi, '') // Remove eval()
    .replace(/alert\(/gi, '') // Remove alert()
    .replace(/confirm\(/gi, '') // Remove confirm()
    .replace(/prompt\(/gi, '') // Remove prompt()
    .replace(/document\./gi, '') // Remove document access
    .replace(/window\./gi, '') // Remove window access
    .replace(/localStorage\./gi, '') // Remove localStorage access
    .replace(/sessionStorage\./gi, '') // Remove sessionStorage access
    .replace(/cookie/gi, '') // Remove cookie access
    .trim();
}

// Sanitize user input for database storage
export function sanitizeUserInput(input: string): string {
  return sanitizeHtml(input)
    .replace(/[^\w\s\-.,'()]/g, '') // Only allow alphanumeric, spaces, hyphens, commas, apostrophes, and parentheses
    .substring(0, 200); // Limit length
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}

// Validate file upload
export function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, WebP, and GIF files are allowed' };
  }

  return { isValid: true };
}

// Address validation schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  county: z.string().min(1, 'County is required').max(100),
  postcode: postcodeSchema,
  country: z.string().default('United Kingdom')
});

// User registration schema
export const userRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: phoneSchema,
  address: addressSchema
});

// Order validation schema
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    name: z.string().optional().default(''),
    price: z.number().optional().default(0),
    quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 items per order'),
    size: z.string().min(1, 'Size is required'),
    color: z.string().optional().default(''),
    image: z.string().optional().default(''),
    baseProductName: z.string().optional().default(''),
    baseProductImage: z.string().optional().default(''),
    orderSource: z.string().optional().default(''),
    customization: z.object({
      isCustomized: z.boolean(),
      name: z.string().optional().default(''),
      number: z.string().optional().default(''),
      customizationCost: z.number().min(0),
      nameCharacters: z.number().optional().default(0),
      numberCharacters: z.number().optional().default(0),
      // Custom design fields
      frontImage: z.string().optional().default(''),
      backImage: z.string().optional().default(''),
      frontPosition: z.object({
        x: z.number(),
        y: z.number()
      }).optional(),
      backPosition: z.object({
        x: z.number(),
        y: z.number()
      }).optional(),
      frontScale: z.number().optional().default(1),
      backScale: z.number().optional().default(1),
      frontRotation: z.number().optional().default(0),
      backRotation: z.number().optional().default(0)
    }).optional()
  })).min(1, 'At least one item is required'),
  shippingDetails: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    shippingMethod: z.literal('Standard Delivery'),
    shippingCost: z.number().min(0, 'Shipping cost must be non-negative')
  }),
  total: z.number().min(0.01, 'Total must be greater than 0'),
  orderSource: z.string().optional()
});

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  basePrice: z.number().min(0.01, 'Base price must be greater than 0'),
  category: z.enum(['tshirts', 'jerseys', 'tanktops', 'longsleeve', 'hoodies', 'sweatshirts', 'sweatpants', 'accessories', 'shortsleeve', 'crewneck']),
  gender: z.enum(['men', 'women', 'unisex', 'kids']),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  colors: z.array(z.object({
    name: z.string().min(1),
    hexCode: z.string().regex(/^#[0-9A-F]{6}$/i, {
      message: 'Invalid hex color code'
    })
  })).optional().default([]),
  stock: z.record(z.string(), z.number().int().min(0)),
  featured: z.boolean().default(false),
  customizable: z.boolean().default(true)
});

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      errors: result.error.issues.map(issue => issue.message) 
    };
  }
} 
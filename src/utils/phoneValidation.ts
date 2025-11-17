import { CSVRow, ValidationStatus } from "@/types/csv";

export const KENYAN_PREFIXES = {
  safaricom: ['0700', '0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', 
              '0710', '0711', '0712', '0713', '0714', '0715', '0716', '0717', '0718', '0719',
              '0720', '0721', '0722', '0723', '0724', '0725', '0726', '0727', '0728', '0729',
              '0740', '0741', '0742', '0743', '0744', '0745', '0746', '0747', '0748', '0749',
              '0757', '0758', '0759', '0768', '0769'],
  airtel: ['0730', '0731', '0732', '0733', '0734', '0735', '0736', '0737', '0738', '0739',
           '0750', '0751', '0752', '0753', '0754', '0755', '0756',
           '0760', '0761', '0762', '0763', '0764', '0765', '0766', '0767',
           '0780', '0781', '0782', '0783', '0784', '0785', '0786', '0787', '0788', '0789'],
  telkom: ['0770', '0771', '0772', '0773', '0774', '0775', '0776', '0777', '0778', '0779']
};

export function cleanPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/[^\d]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '+254' + cleaned;
  }
  
  return cleaned;
}

export function validatePhoneNumber(phone: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned.startsWith('+254')) {
    errors.push('Must start with +254');
  }
  
  if (cleaned.length !== 13) {
    errors.push('Must be 13 characters (+254XXXXXXXXX)');
  }
  
  const startsWithSeven = cleaned.charAt(4) === '7';
  if (!startsWithSeven) {
    errors.push('Must start with +2547');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function detectTelco(phone: string): 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown' {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length < 13) return 'Unknown';
  
  // Get the local format (0xxx)
  const localFormat = '0' + cleaned.substring(4, 8);
  
  for (const [telco, prefixes] of Object.entries(KENYAN_PREFIXES)) {
    if (prefixes.some(prefix => localFormat.startsWith(prefix))) {
      return telco.charAt(0).toUpperCase() + telco.slice(1) as any;
    }
  }
  
  return 'Unknown';
}

export function autoFixPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '');
  
  // Remove leading zeros if more than one
  while (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(1);
  }
  
  // Fix common issues
  if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '+254' + cleaned;
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '+254' + cleaned;
  }
  
  return phone; // Return original if can't fix
}

export type ValidationStatus = 'valid' | 'invalid' | 'warning' | 'duplicate';

export interface CSVRow {
  id: string;
  phoneNumber: string;
  bundleSize: string;
  telco?: 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown';
  status: ValidationStatus;
  errors: string[];
  originalData: Record<string, any>;
  llmSuggestion?: string;
}

export interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  warnings: number;
}

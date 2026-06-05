import * as React from 'npm:react@18.3.1'
import { template as paymentSuccess } from './payment-success.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: Record<string, any>) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'payment-success': paymentSuccess,
}

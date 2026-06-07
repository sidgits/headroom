/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  amount?: string
  dashboardUrl?: string
}

const PaymentSuccessEmail = ({ name, amount, dashboardUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Headroom subscription is active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment confirmed 🎉</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          Thanks for subscribing to Headroom{amount ? ` — we've received your payment of ${amount}` : ''}.
          Your subscription is now active and your full dashboard is unlocked.
        </Text>
        <Button style={button} href={dashboardUrl || 'https://headroomapp.co/dashboard'}>
          Open your dashboard
        </Button>
        <Text style={text}>
          A Stripe receipt will arrive separately with your invoice details.
        </Text>
        <Text style={contactFooter}>Contact — sid@headroomapp.co</Text>
        <Text style={companyFooter}>Headroom is a Digital Lexicon Corp Production.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentSuccessEmail,
  subject: 'Your Headroom subscription is active',
  displayName: 'Payment success',
  previewData: { name: 'Jane', amount: '$9.00', dashboardUrl: 'https://headroomapp.co/dashboard' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  color: '#1a1a1a',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px',
}

const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#1a1a1a',
  margin: '0 0 16px',
  lineHeight: 1.3,
}

const text: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.6,
  color: '#333333',
  margin: '0 0 16px',
}

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#D4A017',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  margin: '8px 0 24px',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: 1.5,
  color: '#666666',
  margin: '24px 0 8px',
}

const companyFooter: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  margin: '24px 0 0',
  borderTop: '1px solid #eeeeee',
  paddingTop: '16px',
}

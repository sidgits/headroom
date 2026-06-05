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
        <Text style={footer}>
          Questions? Just reply to this email and we'll help.
        </Text>
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

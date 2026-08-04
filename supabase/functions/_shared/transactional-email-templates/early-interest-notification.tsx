import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  company?: string
  submittedAt?: string
}

const Email = ({ name, email, company, submittedAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New early interest: ${name ?? 'Unknown'} (${company ?? 'Unknown company'})`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Headroom · Behavioral OS</Text>
        <Heading style={heading}>New early interest registration</Heading>
        <Section style={card}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || '—'}</Text>
          <Text style={label}>Company email</Text>
          <Text style={value}>{email || '—'}</Text>
          <Text style={label}>Company</Text>
          <Text style={value}>{company || '—'}</Text>
          {submittedAt ? (
            <>
              <Text style={label}>Submitted</Text>
              <Text style={value}>{submittedAt}</Text>
            </>
          ) : null}
        </Section>
        <Text style={footer}>Submitted from the /evolution page on headroomapp.co</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New early interest — ${data?.company || data?.name || 'Behavioral OS'}`,
  displayName: 'Early interest notification',
  to: 'hello@headroomapp.co',
  previewData: {
    name: 'Jane Cooper',
    email: 'jane@acme.com',
    company: 'Acme Corp',
    submittedAt: '4 Aug 2026, 11:15 UTC',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'DM Sans', Arial, sans-serif",
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const eyebrow = {
  fontSize: '12px',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  color: '#B4601E',
  margin: '0 0 8px',
}
const heading = { fontSize: '24px', color: '#1A1512', margin: '0 0 24px' }
const card = {
  border: '1px solid #EEE4DA',
  borderRadius: '16px',
  padding: '20px 24px',
  backgroundColor: '#FDFAF6',
}
const label = {
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#8A7A6C',
  margin: '12px 0 2px',
}
const value = { fontSize: '16px', color: '#1A1512', margin: '0' }
const footer = { fontSize: '12px', color: '#8A7A6C', marginTop: '24px' }

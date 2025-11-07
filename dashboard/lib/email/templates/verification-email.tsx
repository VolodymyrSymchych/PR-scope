import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  username: string;
  verificationUrl: string;
}

export const VerificationEmail = ({
  username,
  verificationUrl,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for Project Scope Analyzer</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email address</Heading>
        <Text style={text}>Hi {username},</Text>
        <Text style={text}>
          Thanks for signing up for Project Scope Analyzer! We're excited to have you on board.
        </Text>
        <Text style={text}>
          To get started, please verify your email address by clicking the button below:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={verificationUrl}>
            Verify Email Address
          </Button>
        </Section>
        <Text style={text}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Link href={verificationUrl} style={link}>
          {verificationUrl}
        </Link>
        <Text style={footer}>
          This verification link will expire in 24 hours. If you didn't create an account,
          you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Best regards,
          <br />
          The Project Scope Analyzer Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px 48px',
  marginBottom: '64px',
  borderRadius: '8px',
};

const h1 = {
  color: '#00e5ff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#00e5ff',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const link = {
  color: '#00e5ff',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
};


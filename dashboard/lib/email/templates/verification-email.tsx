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
  Hr,
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
    <Preview>Welcome to Project Scope Analyzer</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={glassCard}>
          <Section style={headerSection}>
            <Heading style={h1}>Welcome</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Text style={greeting}>Hi {username},</Text>
            <Text style={text}>
              Thank you for joining Project Scope Analyzer. We're thrilled to have you on board.
            </Text>
            <Text style={text}>
              To complete your registration and get started, please verify your email address.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
          </Section>
        </Section>

        <Hr style={divider} />

        <Section style={glassCardSecondary}>
          <Section style={linkSection}>
            <Text style={linkText}>
              If the button doesn't work, copy and paste this link into your browser:
            </Text>
            <Link href={verificationUrl} style={link}>
              {verificationUrl}
            </Link>
          </Section>
        </Section>

        <Section style={footerSection}>
          <Text style={footer}>
            This verification link will expire in 24 hours.
          </Text>
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
          <Text style={signature}>
            Best regards,
            <br />
            Project Scope Analyzer Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: '0',
  padding: '40px 20px',
};

const container = {
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
};

const glassCard = {
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  padding: '60px 40px',
  marginBottom: '30px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
};

const glassCardSecondary = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '30px 40px',
  marginBottom: '30px',
  boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
};

const headerSection = {
  marginBottom: '60px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#000000',
  fontSize: '48px',
  fontWeight: '300',
  letterSpacing: '-0.5px',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
  lineHeight: '1.2',
};

const contentSection = {
  marginBottom: '50px',
};

const greeting = {
  color: '#000000',
  fontSize: '18px',
  lineHeight: '28px',
  marginBottom: '24px',
  fontWeight: '400',
};

const text = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '20px',
  fontWeight: '300',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '50px 0',
};

const button = {
  backgroundColor: 'rgba(124, 58, 237, 0.9)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(124, 58, 237, 0.3)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 48px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  boxShadow: '0 4px 16px 0 rgba(124, 58, 237, 0.3)',
};

const divider = {
  borderColor: 'rgba(0, 0, 0, 0.1)',
  borderWidth: '1px',
  borderStyle: 'solid',
  margin: '50px 0',
  opacity: '0.3',
};

const linkSection = {
  marginBottom: '50px',
};

const linkText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  marginBottom: '12px',
  fontWeight: '300',
};

const link = {
  color: '#7c3aed',
  fontSize: '13px',
  textDecoration: 'none',
  wordBreak: 'break-all' as const,
  fontWeight: '400',
};

const footerSection = {
  marginTop: '60px',
};

const footer = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  marginBottom: '12px',
  fontWeight: '300',
};

const signature = {
  color: '#000000',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '40px',
  fontWeight: '400',
};


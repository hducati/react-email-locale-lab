import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'react-email';

export const WelcomeEmail = () => (
  <Html lang="en">
    <Head />
    <Preview>Welcome to our home!</Preview>
    <Body style={{ backgroundColor: '#edf0f7', fontFamily: 'Arial, sans-serif', margin: 0, padding: '40px 12px' }}>
      <Container style={{ backgroundColor: '#ffffff', borderRadius: '18px', margin: '0 auto', maxWidth: '560px', overflow: 'hidden' }}>
        <Section style={{ backgroundColor: '#172036', padding: '28px 36px' }}>
          <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: 0 }}>ACME</Text>
        </Section>
        <Section style={{ padding: '38px 36px 42px' }}>
          <Text style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 10px' }}>Hi, my name is Henrique</Text>
          <Heading style={{ color: '#111827', fontSize: '30px', lineHeight: 1.2, margin: '0 0 18px' }}>Welcome to our beloved city</Heading>
          <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '26px', margin: '0 0 28px' }}>
            Your workspace is ready. Invite your team and start building.
          </Text>
          <Button href="https://example.com" style={{ backgroundColor: '#5b5bd6', borderRadius: '9px', color: '#ffffff', fontSize: '15px', fontWeight: 700, padding: '13px 20px' }}>
            Open workspace
          </Button>
          <Text style={{ borderTop: '1px solid #e5e7eb', color: '#9ca3af', fontSize: '12px', lineHeight: '18px', margin: '34px 0 0', paddingTop: '20px' }}>
            You received this email because an Acme workspace was created for you.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

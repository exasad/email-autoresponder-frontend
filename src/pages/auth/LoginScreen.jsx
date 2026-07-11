import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, App, Alert } from 'antd';
import { LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Shared split-screen login used by both portals. `portal` selects copy,
 * the login handler, and the post-login redirect target.
 */
export default function LoginScreen({ portal, alreadyAuthed, onSubmit, hint }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const home = `/${portal}`;
  const from = location.state?.from?.pathname;

  if (alreadyAuthed) return <Navigate to={from && from.startsWith(home) ? from : home} replace />;

  const isAdmin = portal === 'admin';

  const handleFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await onSubmit(values);
      message.success('Welcome back!');
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setError(err.apiMessage || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero__brand">
          <img src="/logo-mark.svg" alt="SecureMail" width={36} height={36} style={{ borderRadius: 9 }} /> SecureMail
        </div>
        <div>
          <div className="auth-hero__headline">
            {isAdmin ? 'Operate the entire platform from one console.' : 'Automate replies. Capture every lead.'}
          </div>
          <div className="auth-hero__sub">
            {isAdmin
              ? 'Manage users, the global SMTP pool, campaigns and server health — all in a single, secure admin panel.'
              : 'Campaign-based email automation with POP inbox sync, smart follow-ups and real-time lead tracking.'}
          </div>
        </div>
        <div className="auth-hero__stats">
          <div className="auth-hero__stat"><b>99.9%</b><span>Deliverability focus</span></div>
          <div className="auth-hero__stat"><b>Auto</b><span>SMTP rotation</span></div>
          <div className="auth-hero__stat"><b>24/7</b><span>Inbox sync</span></div>
        </div>
      </div>

      <div className="auth-panel">
        <Card className="auth-card" bordered={false} style={{ boxShadow: '0 10px 40px rgba(16,24,40,0.08)' }}>
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>
              {isAdmin ? 'Administrator' : 'Customer'} sign in
            </Text>
            <Title level={2} style={{ margin: '6px 0 0' }}>Sign in to your account</Title>
          </div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={handleFinish} requiredMark={false} size="large">
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
              <Input prefix={<MailOutlined />} placeholder={isAdmin ? 'admin@gmail.com' : 'you@company.com'} autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} icon={<ArrowRightOutlined />} iconPosition="end">
              Sign in
            </Button>
          </Form>

          {hint && (
            <Alert
              type="info" showIcon style={{ marginTop: 16 }}
              message={<span style={{ fontSize: 12 }}>{hint}</span>}
            />
          )}

          {isAdmin && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Not an admin? <Link to="/user/login">User login</Link>
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import React from 'react';
import { Row, Col, Card, Tag, Empty, Typography } from 'antd';
import {
  TeamOutlined, RocketOutlined, InboxOutlined, MailOutlined,
  SendOutlined, RetweetOutlined, ContactsOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../api/client';
import { number } from '../../lib/format';
import { BRAND } from '../../theme/tokens';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await adminApi.get('/dashboard')).data.data,
    refetchInterval: 60_000,
  });

  const t = data?.totals || {};
  const smtp = data?.smtp || {};
  const trend = (data?.trend || []).map((r) => ({
    date: r.date, messages: Number(r.messages), followups: Number(r.followups),
  }));

  const cards = [
    { title: 'Total Users', value: number(t.users), icon: <TeamOutlined />, tint: '#4f46e5' },
    { title: 'Campaigns', value: number(t.campaigns), icon: <RocketOutlined />, tint: '#0ea5e9' },
    { title: 'Mother Mails', value: number(t.motherMails), icon: <InboxOutlined />, tint: '#8b5cf6' },
    { title: 'POP Accounts', value: number(t.popAccounts), icon: <MailOutlined />, tint: '#f59e0b' },
    { title: 'Emails Sent', value: number(t.emailsSent), icon: <SendOutlined />, tint: '#10b981' },
    { title: 'Follow-ups Sent', value: number(t.followupsSent), icon: <RetweetOutlined />, tint: '#ec4899' },
    { title: 'Active Campaigns', value: number(t.activeCampaigns), icon: <RocketOutlined />, tint: '#22c55e' },
    { title: 'Total Leads', value: number(t.leads), icon: <ContactsOutlined />, tint: '#6366f1' },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform-wide performance at a glance" />

      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={12} sm={12} md={6} key={c.title}>
            <StatCard {...c} loading={isLoading} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Sending activity — last 14 days" bordered={false} loading={isLoading}>
            {trend.length === 0 ? (
              <Empty description="No sending activity yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND.accent} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={BRAND.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="messages" stroke={BRAND.primary} fill="url(#gm)" strokeWidth={2} name="Messages" />
                  <Area type="monotone" dataKey="followups" stroke={BRAND.accent} fill="url(#gf)" strokeWidth={2} name="Follow-ups" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Global SMTP status" bordered={false} loading={isLoading} style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StatusRow label="Configured" value={smtp.configured ? 'Yes' : 'No'} ok={smtp.configured} />
              <StatusRow
                label="Connection"
                value={smtp.connection_status || 'unknown'}
                ok={smtp.connection_status === 'connected'}
              />
              <div>
                <Typography.Text type="secondary">Default sender</Typography.Text>
                <div style={{ fontWeight: 600 }}>{smtp.from_email || '—'}</div>
              </div>
              <Tag color={smtp.configured ? 'processing' : 'default'} style={{ width: 'fit-content' }}>
                SMTP is global &amp; shared across all campaigns
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}

function StatusRow({ label, value, ok }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Tag icon={ok ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={ok ? 'success' : 'error'} style={{ textTransform: 'capitalize' }}>
        {value}
      </Tag>
    </div>
  );
}

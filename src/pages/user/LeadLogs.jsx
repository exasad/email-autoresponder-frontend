import React, { useState } from 'react';
import { Table, Card, Tag, Space, Select, Input, Avatar, Typography } from 'antd';
import {
  SearchOutlined, InboxOutlined, MessageOutlined, SendOutlined, RetweetOutlined,
  ClockCircleOutlined, SwapOutlined, FileTextOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import DateRangeFilter from '../../components/DateRangeFilter';
import { userApi } from '../../api/client';
import { dateTime, fromNow } from '../../lib/format';

// event -> { label, color, icon }
const EVENTS = {
  email_received: { label: 'New lead (mother mail)', color: 'blue', icon: <InboxOutlined /> },
  reply_received: { label: 'Reply received (POP)', color: 'gold', icon: <MessageOutlined /> },
  message_sent: { label: 'Reply sent', color: 'green', icon: <SendOutlined /> },
  followup_sent: { label: 'Follow-up sent', color: 'purple', icon: <RetweetOutlined /> },
  queued: { label: 'Added to waiting list', color: 'cyan', icon: <ClockCircleOutlined /> },
  send_failed: { label: 'Send failed (retrying SMTP)', color: 'red', icon: <ExclamationCircleOutlined /> },
  status_changed: { label: 'Status changed', color: 'orange', icon: <SwapOutlined /> },
  note: { label: 'Note', color: 'default', icon: <FileTextOutlined /> },
};

export default function LeadLogs() {
  const [params, setParams] = useState({ page: 1, limit: 15, event: undefined, campaignId: undefined, search: '', from: undefined, to: undefined });

  const { data, isFetching } = useQuery({
    queryKey: ['lead-logs', params],
    queryFn: async () => (await userApi.get('/lead-logs', { params })).data,
    refetchInterval: 15_000,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: async () => (await userApi.get('/campaigns', { params: { limit: 200 } })).data.data,
  });

  const columns = [
    {
      title: 'Event', dataIndex: 'event', width: 210,
      render: (e) => {
        const cfg = EVENTS[e] || { label: e, color: 'default', icon: <FileTextOutlined /> };
        return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Lead', render: (_, r) => (r.lead ? (
        <Space>
          <Avatar size="small" style={{ background: '#6366f1' }}>{(r.lead.name || r.lead.email || '?')[0].toUpperCase()}</Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.lead.name || r.lead.email}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{r.lead.email}</div>
          </div>
        </Space>
      ) : <span style={{ opacity: 0.5 }}>—</span>),
    },
    { title: 'Campaign', render: (_, r) => r.campaign?.campaign_name || '—' },
    { title: 'Detail', dataIndex: 'description', render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span> },
    {
      title: 'When', width: 160,
      render: (_, r) => {
        const v = r.createdAt || r.created_at;
        return <Typography.Text type="secondary" title={dateTime(v)}>{fromNow(v)}</Typography.Text>;
      },
    },
  ];

  return (
    <>
      <PageHeader title="Lead Logs" subtitle="Full activity timeline across all your leads" />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search lead name/email" style={{ width: 240 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Event type" style={{ width: 200 }}
            options={Object.entries(EVENTS).map(([v, c]) => ({ value: v, label: c.label }))}
            onChange={(event) => setParams((p) => ({ ...p, page: 1, event }))} />
          <Select allowClear placeholder="Campaign" style={{ width: 200 }} showSearch optionFilterProp="label"
            options={(campaigns || []).map((c) => ({ value: c.id, label: c.campaign_name }))}
            onChange={(campaignId) => setParams((p) => ({ ...p, page: 1, campaignId }))} />
          <DateRangeFilter onChange={(_r, f) => setParams((p) => ({ ...p, page: 1, from: f.from, to: f.to }))} />
        </Space>

        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 900 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} events`, showSizeChanger: false,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>
    </>
  );
}

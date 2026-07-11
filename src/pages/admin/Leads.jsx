import React, { useState } from 'react';
import {
  Table, Input, Select, Space, Tag, Card, App, Button, Dropdown, Drawer, Descriptions, Timeline, Typography, Avatar, Grid,
} from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import DateRangeFilter from '../../components/DateRangeFilter';
import { adminApi } from '../../api/client';
import { dateTime, fromNow } from '../../lib/format';

const LEAD_STATUS = {
  new: 'blue', contacted: 'cyan', in_sequence: 'geekblue', replied: 'green',
  converted: 'success', unsubscribed: 'default', bounced: 'error',
};
const EVENT_COLOR = {
  email_received: 'blue', message_sent: 'green', followup_sent: 'purple',
  reply_received: 'gold', status_changed: 'orange', note: 'gray',
};

export default function Leads() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: undefined, userId: undefined, records: undefined, from: undefined, to: undefined });
  const [detailId, setDetailId] = useState(null);

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'leads', params],
    queryFn: async () => (await adminApi.get('/leads', { params })).data,
  });
  const { data: users } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: async () => (await adminApi.get('/users', { params: { limit: 200 } })).data.data,
  });

  const exportLeads = async (format) => {
    try {
      const res = await adminApi.get('/leads/export', { params: { ...params, format }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `all-leads.${format === 'xlsx' ? 'xlsx' : 'csv'}`; a.click();
      URL.revokeObjectURL(url);
    } catch { message.error('Export failed'); }
  };

  const columns = [
    {
      title: 'Lead', render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#6366f1' }}>{(r.name || r.email || '?')[0].toUpperCase()}</Avatar>
          <div>
            <a onClick={() => setDetailId(r.id)} style={{ fontWeight: 600 }}>{r.name || r.email}</a>
            {r.deleted_at && <Tag color="red" style={{ marginLeft: 6 }}>deleted</Tag>}
            <div style={{ fontSize: 12, opacity: 0.6 }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Owner', render: (_, r) => r.user?.name || '—' },
    { title: 'Campaign', render: (_, r) => r.campaign?.campaign_name || '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={LEAD_STATUS[s]} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</Tag> },
    { title: 'Last activity', dataIndex: 'last_activity_at', render: (v) => v ? fromNow(v) : '—' },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="All leads across every user"
        extra={(
          <Dropdown menu={{ items: [{ key: 'csv', label: 'Export CSV' }, { key: 'xlsx', label: 'Export Excel' }], onClick: ({ key }) => exportLeads(key) }}>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        )}
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search name, email, company" style={{ width: 240 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Owner" style={{ width: 200 }} showSearch optionFilterProp="label"
            options={(users || []).map((u) => ({ value: u.id, label: u.name }))}
            onChange={(userId) => setParams((p) => ({ ...p, page: 1, userId }))} />
          <Select allowClear placeholder="Status" style={{ width: 150 }}
            options={Object.keys(LEAD_STATUS).map((v) => ({ value: v, label: v.replace('_', ' ') }))}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))} />
          <Select placeholder="Records" style={{ width: 150 }} defaultValue={undefined} allowClear
            options={[{ value: 'active', label: 'Active only' }, { value: 'deleted', label: 'Deleted only' }, { value: 'all', label: 'All (incl. deleted)' }]}
            onChange={(records) => setParams((p) => ({ ...p, page: 1, records }))} />
          <DateRangeFilter onChange={(_r, f) => setParams((p) => ({ ...p, page: 1, from: f.from, to: f.to }))} />
        </Space>

        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 760 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} leads`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      <Drawer
        open={!!detailId} onClose={() => setDetailId(null)}
        width={screens.sm ? 480 : '100%'}
        title="Lead detail"
      >
        {detailId && <AdminLeadDetail id={detailId} />}
      </Drawer>
    </>
  );
}

function AdminLeadDetail({ id }) {
  const { data: lead } = useQuery({
    queryKey: ['admin', 'lead', id],
    queryFn: async () => (await adminApi.get(`/leads/${id}`)).data.data,
  });
  if (!lead) return null;
  return (
    <>
      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
        <Descriptions.Item label="Owner">{lead.user?.name}</Descriptions.Item>
        <Descriptions.Item label="Campaign">{lead.campaign?.campaign_name || '—'}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={LEAD_STATUS[lead.status]}>{lead.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="Original subject">{lead.source_subject || '—'}</Descriptions.Item>
      </Descriptions>
      <Typography.Title level={5}>Activity</Typography.Title>
      <Timeline
        items={(lead.logs || []).map((log) => ({
          color: EVENT_COLOR[log.event] || 'blue',
          children: (
            <div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{log.event.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: 13 }}>{log.description}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>{dateTime(log.created_at)}</div>
            </div>
          ),
        }))}
      />
    </>
  );
}

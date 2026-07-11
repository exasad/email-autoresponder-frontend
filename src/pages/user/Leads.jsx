import React, { useState } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Card, App, Dropdown, Drawer,
  Descriptions, Timeline, Typography, Popconfirm, Avatar, Grid,
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, MoreOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import DateRangeFilter from '../../components/DateRangeFilter';
import { userApi } from '../../api/client';
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
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: undefined, campaignId: undefined, from: undefined, to: undefined });
  const [selected, setSelected] = useState([]);
  const [detailId, setDetailId] = useState(null);

  const { data, isFetching } = useQuery({
    queryKey: ['leads', params],
    queryFn: async () => (await userApi.get('/leads', { params })).data,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', 'all'],
    queryFn: async () => (await userApi.get('/campaigns', { params: { limit: 100 } })).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['leads'] });

  const bulkMut = useMutation({
    mutationFn: (payload) => userApi.post('/leads/bulk', payload),
    onSuccess: () => { message.success('Applied'); setSelected([]); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const exportLeads = async (format) => {
    try {
      const res = await userApi.get('/leads/export', { params: { ...params, format }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `leads.${format === 'xlsx' ? 'xlsx' : 'csv'}`; a.click();
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
            <div style={{ fontSize: 12, opacity: 0.6 }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Campaign', render: (_, r) => r.campaign?.campaign_name || '—' },
    { title: 'Company', dataIndex: 'company', render: (v) => v || '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={LEAD_STATUS[s]} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</Tag> },
    { title: 'Last activity', dataIndex: 'last_activity_at', render: (v) => v ? fromNow(v) : '—' },
    {
      title: '', width: 48, align: 'right',
      render: (_, r) => (
        <Dropdown trigger={['click']} menu={{
          items: [{ key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true }],
          onClick: ({ key }) => key === 'delete' && modal.confirm({
            title: 'Delete lead?', okType: 'danger',
            onOk: () => userApi.delete(`/leads/${r.id}`).then(() => { message.success('Deleted'); invalidate(); }),
          }),
        }}><Button type="text" icon={<MoreOutlined />} /></Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Auto-created from inbound emails · tracked through the sequence"
        extra={(
          <Dropdown menu={{ items: [
            { key: 'csv', label: 'Export CSV' },
            { key: 'xlsx', label: 'Export Excel' },
          ], onClick: ({ key }) => exportLeads(key) }}>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        )}
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search name, email, company" style={{ width: 260 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Status" style={{ width: 150 }}
            options={Object.keys(LEAD_STATUS).map((v) => ({ value: v, label: v.replace('_', ' ') }))}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))} />
          <Select allowClear placeholder="Campaign" style={{ width: 200 }} showSearch optionFilterProp="label"
            options={(campaigns || []).map((c) => ({ value: c.id, label: c.campaign_name }))}
            onChange={(campaignId) => setParams((p) => ({ ...p, page: 1, campaignId }))} />
          <DateRangeFilter onChange={(_r, f) => setParams((p) => ({ ...p, page: 1, from: f.from, to: f.to }))} />
        </Space>

        {selected.length > 0 && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--ant-color-fill-quaternary)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{selected.length} selected</span>
            <Select size="small" placeholder="Set status" style={{ width: 160 }}
              options={Object.keys(LEAD_STATUS).map((v) => ({ value: v, label: v.replace('_', ' ') }))}
              onChange={(value) => bulkMut.mutate({ ids: selected, action: 'status', value })} />
            <Popconfirm title="Delete selected leads?" onConfirm={() => bulkMut.mutate({ ids: selected, action: 'delete' })}>
              <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          </div>
        )}

        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 760 }}
          rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} leads`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      <LeadDrawer id={detailId} onClose={() => setDetailId(null)} onChanged={invalidate} />
    </>
  );
}

function LeadDrawer({ id, onClose, onChanged }) {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const { data: lead, isLoading } = useQuery({
    enabled: !!id,
    queryKey: ['lead', id],
    queryFn: async () => (await userApi.get(`/leads/${id}`)).data.data,
  });

  const statusMut = useMutation({
    mutationFn: (status) => userApi.patch(`/leads/${id}`, { status }),
    onSuccess: () => { message.success('Status updated'); onChanged(); },
    onError: (e) => message.error(e.apiMessage),
  });

  return (
    <Drawer open={!!id} onClose={onClose} width={screens.sm ? 480 : '100%'} title={lead ? (lead.name || lead.email) : 'Lead'} loading={isLoading}>
      {lead && (
        <>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
            <Descriptions.Item label="Company">{lead.company || '—'}</Descriptions.Item>
            <Descriptions.Item label="Campaign">{lead.campaign?.campaign_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Original subject">{lead.source_subject || '—'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Select value={lead.status} size="small" style={{ width: 180 }}
                options={Object.keys(LEAD_STATUS).map((v) => ({ value: v, label: v.replace('_', ' ') }))}
                onChange={(v) => statusMut.mutate(v)} />
            </Descriptions.Item>
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
      )}
    </Drawer>
  );
}

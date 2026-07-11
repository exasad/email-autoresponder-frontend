import React, { useState } from 'react';
import { Table, Input, Select, Space, Tag, Card, Button, Alert } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { userApi } from '../../api/client';
import { date, fromNow } from '../../lib/format';

const STATUS = { active: 'success', paused: 'warning', expired: 'error', draft: 'default' };

/**
 * User campaigns are READ-ONLY — campaigns are created and edited by an admin.
 * Users open a campaign to configure its mother mail, replies and follow-ups.
 */
export default function Campaigns() {
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: undefined });

  const { data, isFetching } = useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => (await userApi.get('/campaigns', { params })).data,
  });

  const columns = [
    { title: 'Campaign', render: (_, r) => <a onClick={() => navigate(`/user/campaigns/${r.id}`)} style={{ fontWeight: 600 }}>{r.campaign_name}</a> },
    { title: 'From name', dataIndex: 'model_name', render: (v) => v || '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag> },
    { title: 'Daily', dataIndex: 'daily_limit', render: (v, r) => `${r.sent_today || 0} / ${v}` },
    { title: 'Mother mail', render: (_, r) => r.motherMail ? <Tag color={r.motherMail.connection_status === 'connected' ? 'success' : 'default'}>{r.motherMail.email_address}</Tag> : <Tag>not set</Tag> },
    { title: 'Expires', dataIndex: 'expire_date', render: (v) => v ? date(v) : 'never' },
    { title: 'Created', dataIndex: 'created_at', render: (v) => fromNow(v) },
    {
      title: '', width: 90, align: 'right',
      render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/user/campaigns/${r.id}`)}>Open</Button>,
    },
  ];

  return (
    <>
      <PageHeader title="Campaigns" subtitle="Open a campaign to configure its mother mail, replies and follow-ups" />

      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="Campaigns are set up by your administrator. Open one to manage its mother mail, replies, follow-ups and leads."
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search campaigns" style={{ width: 260 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Status" style={{ width: 150 }}
            options={['active', 'paused', 'expired', 'draft'].map((v) => ({ value: v, label: v }))}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))} />
        </Space>

        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 860 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} campaigns`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>
    </>
  );
}

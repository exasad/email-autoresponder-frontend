import React, { useState } from 'react';
import { Table, Card, Tag, Button, Input, Space, Modal, App } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import MotherMailPanel from '../../components/MotherMailPanel';
import { userApi } from '../../api/client';
import { fromNow } from '../../lib/format';

const CONN = { connected: 'success', failed: 'error', unknown: 'default' };

/**
 * Mother Mail listing — one row per campaign (each campaign has exactly one
 * mother mailbox). "Configure" opens the mother-mail form for that campaign.
 */
export default function MotherMailPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '' });
  const [active, setActive] = useState(null); // campaign being configured

  const { data, isFetching } = useQuery({
    queryKey: ['campaigns', 'mother-mail-list', params],
    queryFn: async () => (await userApi.get('/campaigns', { params })).data,
  });

  const closeAndRefresh = () => {
    setActive(null);
    qc.invalidateQueries({ queryKey: ['campaigns', 'mother-mail-list'] });
  };

  const columns = [
    { title: 'Campaign', dataIndex: 'campaign_name', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    {
      title: 'Mother mail', render: (_, r) => (r.motherMail
        ? <span>{r.motherMail.email_address}</span>
        : <Tag>not configured</Tag>),
    },
    {
      title: 'Connection', render: (_, r) => (r.motherMail
        ? <Tag color={CONN[r.motherMail.connection_status] || 'default'}>{r.motherMail.connection_status}</Tag>
        : <Tag color="default">—</Tag>),
    },
    { title: 'Updated', dataIndex: 'updated_at', render: (v) => fromNow(v) },
    {
      title: '', align: 'right', width: 140,
      render: (_, r) => (
        <Button icon={<SettingOutlined />} onClick={() => setActive(r)}>
          {r.motherMail ? 'Manage' : 'Configure'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Mother Mail"
        subtitle="Each campaign has one mother mailbox that receives new prospects and creates leads"
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search campaigns" style={{ width: 260 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
        </Space>
        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 640 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} campaigns`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      <Modal
        open={!!active}
        title={active ? `Mother Mail — ${active.campaign_name}` : ''}
        footer={null}
        onCancel={closeAndRefresh}
        width={720}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
        destroyOnClose
      >
        {active && <MotherMailPanel campaignId={active.id} />}
      </Modal>
    </>
  );
}

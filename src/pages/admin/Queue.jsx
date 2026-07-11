import React, { useState } from 'react';
import {
  Table, Tag, Card, Row, Col, Statistic, Button, Space, Select, Input, App, Tooltip, Typography,
} from 'antd';
import {
  ReloadOutlined, RedoOutlined, StopOutlined, SearchOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { adminApi } from '../../api/client';
import { dateTime, fromNow, number } from '../../lib/format';

const STATUS = { queued: 'processing', processing: 'warning', sent: 'success', failed: 'error', cancelled: 'default' };

export default function Queue() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10, status: undefined, type: undefined, search: '' });

  const { data: summary } = useQuery({
    queryKey: ['admin', 'queue', 'summary'],
    queryFn: async () => (await adminApi.get('/queue/summary')).data.data,
    refetchInterval: 5000,
  });

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'queue', params],
    queryFn: async () => (await adminApi.get('/queue', { params })).data,
    refetchInterval: 8000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'queue'] });

  const act = useMutation({
    mutationFn: ({ id, action }) => adminApi.post(`/queue/${id}/${action}`),
    onSuccess: () => { message.success('Done'); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });
  const retryAll = useMutation({
    mutationFn: () => adminApi.post('/queue/retry-failed'),
    onSuccess: ({ data: r }) => { message.success(r.message); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const counts = summary?.counts || {};
  const workers = summary?.workers || { jobs: [] };

  const columns = [
    { title: 'Recipient', dataIndex: 'to_email' },
    { title: 'Campaign', render: (_, r) => r.campaign?.campaign_name || '—' },
    { title: 'Type', dataIndex: 'sendable_type', render: (t) => <Tag>{t === 'followup' ? 'follow-up' : 'reply'}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS[s]}>{s}</Tag> },
    { title: 'Attempts', render: (_, r) => `${r.attempts}/${r.max_attempts}` },
    { title: 'Scheduled', dataIndex: 'scheduled_at', render: (v) => fromNow(v) },
    { title: 'Sent', dataIndex: 'sent_at', render: (v) => v ? dateTime(v) : '—' },
    { title: 'Error', dataIndex: 'last_error', render: (v) => v ? <Tooltip title={v}><span style={{ color: '#ef4444' }}>error</span></Tooltip> : '—' },
    {
      title: '', align: 'right', width: 90,
      render: (_, r) => (
        <Space>
          {['failed', 'cancelled'].includes(r.status) && (
            <Tooltip title="Retry now"><Button size="small" icon={<RedoOutlined />} onClick={() => act.mutate({ id: r.id, action: 'retry' })} /></Tooltip>
          )}
          {['queued'].includes(r.status) && (
            <Tooltip title="Cancel"><Button size="small" danger icon={<StopOutlined />} onClick={() => act.mutate({ id: r.id, action: 'cancel' })} /></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Email Queue & Cron"
        subtitle="Live sending queue and background worker health"
        extra={(
          <Space>
            <Button icon={<ReloadOutlined />} onClick={invalidate}>Refresh</Button>
            <Button type="primary" icon={<RedoOutlined />} loading={retryAll.isPending} onClick={() => retryAll.mutate()}>Retry all failed</Button>
          </Space>
        )}
      />

      <Row gutter={[16, 16]}>
        {['queued', 'processing', 'sent', 'failed', 'cancelled'].map((s) => (
          <Col xs={12} sm={8} md={4} key={s}>
            <Card bordered={false}><Statistic title={s} value={number(counts[s] || 0)} valueStyle={{ color: s === 'failed' ? '#ef4444' : undefined }} /></Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<><ThunderboltOutlined /> Cron jobs</>} bordered={false} style={{ marginTop: 16 }}
        extra={<Tag color={workers.started ? 'success' : 'default'}>{workers.started ? 'running' : 'stopped'}</Tag>}
      >
        <Table
          rowKey="name" size="small" pagination={false} scroll={{ x: 640 }}
          dataSource={workers.jobs || []}
          columns={[
            { title: 'Job', dataIndex: 'name', render: (v) => <b style={{ textTransform: 'capitalize' }}>{v}</b> },
            { title: 'Schedule', dataIndex: 'cron', render: (v) => <code style={{ fontSize: 12 }}>{v || '—'}</code> },
            { title: 'Runs', dataIndex: 'runs' },
            { title: 'State', dataIndex: 'running', render: (r) => <Tag color={r ? 'processing' : 'default'}>{r ? 'running' : 'idle'}</Tag> },
            { title: 'Last run', dataIndex: 'lastRunAt', render: (v) => v ? fromNow(v) : 'never' },
          ]}
        />
      </Card>

      <Card bordered={false} style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search recipient email" style={{ width: 240 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Status" style={{ width: 150 }}
            options={Object.keys(STATUS).map((v) => ({ value: v, label: v }))}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))} />
          <Select allowClear placeholder="Type" style={{ width: 150 }}
            options={[{ value: 'message', label: 'Reply' }, { value: 'followup', label: 'Follow-up' }]}
            onChange={(type) => setParams((p) => ({ ...p, page: 1, type }))} />
        </Space>
        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 900 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} items`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>
    </>
  );
}

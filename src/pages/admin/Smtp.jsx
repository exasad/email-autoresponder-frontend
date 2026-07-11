import React, { useState } from 'react';
import {
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, App,
  Card, Alert, Tooltip, Switch, Dropdown, Row, Col,
} from 'antd';
import {
  PlusOutlined, ThunderboltOutlined, MoreOutlined, EditOutlined, DeleteOutlined,
  PoweroffOutlined, SyncOutlined, CheckCircleOutlined, SearchOutlined, ImportOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import SmtpImportModal from '../../components/SmtpImportModal';
import { adminApi } from '../../api/client';
import { fromNow } from '../../lib/format';

const CONN_COLORS = { connected: 'success', failed: 'error', unknown: 'default' };

export default function Smtp() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: undefined, connection: undefined });
  const [form] = Form.useForm();

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'smtp'],
    queryFn: async () => (await adminApi.get('/smtp')).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'smtp'] });

  const saveMut = useMutation({
    mutationFn: (v) => (v.id ? adminApi.patch(`/smtp/${v.id}`, v) : adminApi.post('/smtp', v)),
    onSuccess: () => { message.success('SMTP saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const testMut = useMutation({
    mutationFn: (id) => adminApi.post(`/smtp/${id}/test`),
    onSuccess: ({ data: r }) => { r.data.ok ? message.success(r.data.message) : message.error(r.data.message); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const simpleMut = useMutation({
    mutationFn: ({ id, path, method = 'post' }) => adminApi[method](`/smtp/${id}${path}`),
    onSuccess: () => { message.success('Done'); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (row) => {
    setEditing(row || {});
    form.setFieldsValue(row || { port: 587, encryption: 'tls', status: 'active' });
  };

  const columns = [
    {
      title: 'Sender', render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.from_name} {r.is_default && <Tag color="blue">default</Tag>}</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{r.from_email}</div>
        </div>
      ),
    },
    { title: 'Host', render: (_, r) => <span style={{ fontSize: 12 }}>{r.host}:{r.port} · {r.encryption.toUpperCase()}</span> },
    {
      title: 'Status', render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={r.status === 'active' ? 'success' : 'default'} style={{ textTransform: 'capitalize' }}>{r.status}</Tag>
          {r.auto_disabled && (
            <Tooltip title={r.disabled_reason}>
              <Tag color={r.disabled_until ? 'warning' : 'error'}>
                {r.disabled_until ? `parked · retry ${fromNow(r.disabled_until)}` : 'auto-disabled'}
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Connection', dataIndex: 'connection_status',
      render: (c, r) => (
        <Tooltip title={r.last_error || (r.last_tested_at ? `Tested ${fromNow(r.last_tested_at)}` : 'Never tested')}>
          <Tag color={CONN_COLORS[c]} style={{ textTransform: 'capitalize' }}>{c}</Tag>
        </Tooltip>
      ),
    },
    { title: 'Order', dataIndex: 'sort_order', width: 70 },
    {
      title: '', width: 120, align: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Test connection">
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={testMut.isPending && testMut.variables === r.id}
              onClick={() => testMut.mutate(r.id)}
            />
          </Tooltip>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
                r.status === 'active'
                  ? null
                  : { key: 'enable', icon: <CheckCircleOutlined />, label: 'Enable' },
                { key: 'default', icon: <CheckCircleOutlined />, label: 'Set as default' },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
              ].filter(Boolean),
              onClick: ({ key }) => {
                if (key === 'edit') openEdit(r);
                if (key === 'enable') simpleMut.mutate({ id: r.id, path: '/enable' });
                if (key === 'default') saveMut.mutate({ id: r.id, is_default: true });
                if (key === 'delete') modal.confirm({
                  title: 'Delete SMTP?', okType: 'danger',
                  onOk: () => adminApi.delete(`/smtp/${r.id}`).then(invalidate),
                });
              },
            }}
          >
            <Button size="small" type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const disabled = (data || []).filter((s) => s.auto_disabled);

  const filtered = (data || []).filter((s) => {
    if (filters.status && s.status !== filters.status) return false;
    if (filters.connection && s.connection_status !== filters.connection) return false;
    if (filters.search) {
      const hay = `${s.from_name || ''} ${s.from_email || ''} ${s.username || ''} ${s.host || ''}`.toLowerCase();
      if (!hay.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Global SMTP Pool"
        subtitle="Shared by every campaign · leads rotate across active senders (1 lead = 1 SMTP)"
        extra={(
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>Add SMTP</Button>
          </Space>
        )}
      />

      {disabled.length > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message={`${disabled.length} SMTP account(s) auto-disabled after being blocked/rate-limited by the provider. Rate-limited accounts re-enable automatically once their cooldown elapses.`}
          description={disabled.map((s) => (
            <div key={s.id}>• <b>{s.from_email}</b> — {s.disabled_reason}
              {s.disabled_until ? ` (auto-retry ${fromNow(s.disabled_until)})` : ' (manual re-enable required)'}
            </div>
          ))}
        />
      )}

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear prefix={<SearchOutlined />} placeholder="Search sender, username, host"
            style={{ width: 260 }}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <Select
            allowClear placeholder="Status" style={{ width: 150 }}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            onChange={(status) => setFilters((f) => ({ ...f, status }))}
          />
          <Select
            allowClear placeholder="Connection" style={{ width: 170 }}
            options={['connected', 'failed', 'unknown'].map((v) => ({ value: v, label: v }))}
            onChange={(connection) => setFilters((f) => ({ ...f, connection }))}
          />
        </Space>
        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={filtered}
          scroll={{ x: 760 }}
          pagination={filtered.length > 10 ? { pageSize: 10, showTotal: (t) => `${t} SMTP accounts` } : false}
        />
      </Card>

      <Modal
        open={editing !== null}
        title={editing?.id ? 'Edit SMTP' : 'Add SMTP'}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText="Save"
        destroyOnClose
        width={720}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Space.Compact block>
            <Form.Item name="host" label="Host" rules={[{ required: true }]} style={{ flex: 1, marginRight: 8 }}>
              <Input placeholder="smtp.gmail.com" />
            </Form.Item>
            <Form.Item name="port" label="Port" rules={[{ required: true }]} style={{ width: 110 }}>
              <InputNumber min={1} max={65535} placeholder="587" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="encryption" label="Encryption" initialValue="tls">
            <Select placeholder="Select encryption" options={[{ value: 'tls', label: 'TLS / STARTTLS' }, { value: 'ssl', label: 'SSL' }, { value: 'none', label: 'None' }]} />
          </Form.Item>
          <Form.Item name="username" label="Sender email (username)" rules={[{ required: true, type: 'email' }]}
            tooltip="The authenticated account address. Emails are sent from this address; the From name comes from each campaign's model name.">
            <Input placeholder="you@gmail.com" />
          </Form.Item>
          <Form.Item name="password" label="Password / App password" rules={editing?.id ? [] : [{ required: true }]}>
            <Input.Password placeholder={editing?.id ? 'Leave blank to keep current' : 'App password'} />
          </Form.Item>
          <Space size="large" align="start">
            <Form.Item name="status" label="Status" initialValue="active">
              <Select style={{ width: 150 }} placeholder="Select status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </Form.Item>
            <Form.Item name="is_default" label="Default sender" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>

      <SmtpImportModal open={importOpen} onClose={() => setImportOpen(false)} api={adminApi} onDone={invalidate} />
    </>
  );
}

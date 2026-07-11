import React, { useState } from 'react';
import {
  Table, Button, Space, Tag, Card, Modal, Form, Input, InputNumber, Select, App, Tooltip, Dropdown, Alert, Row, Col, Popconfirm,
} from 'antd';
import {
  PlusOutlined, ThunderboltOutlined, MoreOutlined, EditOutlined, DeleteOutlined, ImportOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import SmtpImportModal from '../../components/SmtpImportModal';
import { userApi } from '../../api/client';
import { fromNow } from '../../lib/format';

const CONN = { connected: 'success', failed: 'error', unknown: 'default' };

export default function Smtp() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [form] = Form.useForm();

  const { data, isFetching } = useQuery({
    queryKey: ['user', 'smtp'],
    queryFn: async () => (await userApi.get('/smtp')).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['user', 'smtp'] });

  const saveMut = useMutation({
    mutationFn: (v) => (v.id ? userApi.patch(`/smtp/${v.id}`, v) : userApi.post('/smtp', v)),
    onSuccess: () => { message.success('Saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });
  const testMut = useMutation({
    mutationFn: (id) => userApi.post(`/smtp/${id}/test`),
    onSuccess: ({ data: r }) => { r.data.ok ? message.success(r.data.message) : message.error(r.data.message); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });
  const bulkMut = useMutation({
    mutationFn: (payload) => userApi.post('/smtp/bulk', payload),
    onSuccess: ({ data: r }) => { message.success(`Applied to ${r.data.affected} account(s)`); setSelected([]); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (row) => {
    setEditing(row || {});
    form.setFieldsValue(row || { port: 587, encryption: 'tls', status: 'active' });
  };

  const columns = [
    { title: 'Sender', render: (_, r) => <div><div style={{ fontWeight: 600 }}>{r.from_email || r.username}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{r.host}:{r.port} · {r.encryption.toUpperCase()}</div></div> },
    {
      title: 'Status', dataIndex: 'status',
      render: (s, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag>
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
    { title: 'Connection', dataIndex: 'connection_status', render: (c, r) => <Tooltip title={r.last_error || ''}><Tag color={CONN[c]}>{c}</Tag></Tooltip> },
    { title: 'Last tested', dataIndex: 'last_tested_at', render: (v) => v ? fromNow(v) : 'never' },
    {
      title: '', width: 110, align: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Test connection">
            <Button size="small" icon={<ThunderboltOutlined />} loading={testMut.isPending && testMut.variables === r.id} onClick={() => testMut.mutate(r.id)} />
          </Tooltip>
          <Dropdown trigger={['click']} menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') openEdit(r);
              if (key === 'delete') modal.confirm({ title: 'Delete SMTP?', okType: 'danger', onOk: () => userApi.delete(`/smtp/${r.id}`).then(() => { message.success('Deleted'); invalidate(); }) });
            },
          }}><Button size="small" type="text" icon={<MoreOutlined />} /></Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My SMTP"
        subtitle="Your own sending accounts — your campaigns rotate across these (1 lead = 1 SMTP)"
        extra={(
          <Space>
            <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>Add SMTP</Button>
          </Space>
        )}
      />

      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="Emails send from the account's own address; the From name is your campaign's model name. If you have no active SMTP, the platform's global SMTP is used as a fallback."
      />

      <Card bordered={false}>
        {selected.length > 0 && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--ant-color-fill-quaternary)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{selected.length} selected</span>
            <Select size="small" placeholder="Set status" style={{ width: 150 }}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              onChange={(value) => bulkMut.mutate({ ids: selected, action: 'status', value })} />
            <Popconfirm title={`Delete ${selected.length} SMTP account(s)?`} okType="danger"
              onConfirm={() => bulkMut.mutate({ ids: selected, action: 'delete' })}>
              <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
            <Button size="small" type="text" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}
        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data || []} scroll={{ x: 640 }} pagination={false}
          rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
        />
      </Card>

      <Modal
        open={editing !== null} title={editing?.id ? 'Edit SMTP' : 'Add SMTP'}
        onCancel={() => { setEditing(null); form.resetFields(); }} onOk={() => form.submit()}
        confirmLoading={saveMut.isPending} okText="Save" destroyOnClose width={720}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="host" label="Host" rules={[{ required: true }]}><Input placeholder="smtp.gmail.com" /></Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="port" label="Port"><InputNumber min={1} max={65535} placeholder="587" style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="encryption" label="Encryption" initialValue="tls">
            <Select placeholder="Select encryption" options={[{ value: 'tls', label: 'TLS / STARTTLS' }, { value: 'ssl', label: 'SSL' }, { value: 'none', label: 'None' }]} />
          </Form.Item>
          <Form.Item name="username" label="Sender email (username)" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@gmail.com" />
          </Form.Item>
          <Form.Item name="password" label="Password / App password" rules={editing?.id ? [] : [{ required: true }]}>
            <Input.Password placeholder={editing?.id ? 'Leave blank to keep current' : 'App password'} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select placeholder="Select status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <SmtpImportModal open={importOpen} onClose={() => setImportOpen(false)} api={userApi} onDone={invalidate} />
    </>
  );
}

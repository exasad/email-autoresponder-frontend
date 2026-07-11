import React, { useState } from 'react';
import {
  Table, Button, Space, Tag, Card, Modal, Form, Input, InputNumber, Select, App, Tooltip, Dropdown, Alert, Row, Col,
} from 'antd';
import {
  PlusOutlined, ThunderboltOutlined, SyncOutlined, MoreOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { adminApi } from '../../api/client';
import { fromNow } from '../../lib/format';

const CONN = { connected: 'success', failed: 'error', unknown: 'default' };

export default function PopAccounts() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10 });
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'pop-accounts', params],
    queryFn: async () => (await adminApi.get('/pop-accounts', { params })).data,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['admin', 'campaigns', 'picker'],
    queryFn: async () => (await adminApi.get('/campaigns', { params: { limit: 200 } })).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'pop-accounts'] });

  const saveMut = useMutation({
    mutationFn: (v) => (v.id ? adminApi.patch(`/pop-accounts/${v.id}`, v) : adminApi.post('/pop-accounts', v)),
    onSuccess: () => { message.success('Saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });
  const testMut = useMutation({
    mutationFn: (id) => adminApi.post(`/pop-accounts/${id}/test`),
    onSuccess: ({ data: r }) => { r.data.ok ? message.success(r.data.message) : message.error(r.data.message); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });
  const syncMut = useMutation({
    mutationFn: (id) => adminApi.post(`/pop-accounts/${id}/sync`),
    onSuccess: ({ data: r }) => { message.success(`Synced — ${r.data.matched ?? 0} replies matched`); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (row) => {
    setEditing(row || {});
    form.setFieldsValue(row || { port: 995, encryption: 'ssl', status: 'active' });
  };

  const columns = [
    { title: 'Mailbox', render: (_, r) => <div><div style={{ fontWeight: 600 }}>{r.label || r.username}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{r.username}</div></div> },
    { title: 'Campaign', render: (_, r) => (r.campaign ? <Tag color="blue">{r.campaign.campaign_name}</Tag> : <Tag>unassigned</Tag>) },
    { title: 'Host', render: (_, r) => <span style={{ fontSize: 12 }}>{r.host}:{r.port} · {r.encryption.toUpperCase()}</span> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag> },
    { title: 'Connection', dataIndex: 'connection_status', render: (c, r) => <Tooltip title={r.last_error || ''}><Tag color={CONN[c]}>{c}</Tag></Tooltip> },
    { title: 'Last sync', dataIndex: 'last_synced_at', render: (v) => v ? fromNow(v) : 'never' },
    {
      title: '', width: 120, align: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="Test"><Button size="small" icon={<ThunderboltOutlined />} loading={testMut.isPending && testMut.variables === r.id} onClick={() => testMut.mutate(r.id)} /></Tooltip>
          <Tooltip title="Read inbox now"><Button size="small" icon={<SyncOutlined />} loading={syncMut.isPending && syncMut.variables === r.id} onClick={() => syncMut.mutate(r.id)} /></Tooltip>
          <Dropdown trigger={['click']} menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') openEdit(r);
              if (key === 'delete') modal.confirm({ title: 'Delete POP account?', okType: 'danger', onOk: () => adminApi.delete(`/pop-accounts/${r.id}`).then(() => { message.success('Deleted'); invalidate(); }) });
            },
          }}><Button size="small" type="text" icon={<MoreOutlined />} /></Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="POP Accounts"
        subtitle="Global reply mailboxes — lead replies are fetched here and matched to leads"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>Add POP account</Button>}
      />

      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="Outbound emails set Reply-To to one of these mailboxes, so leads' replies arrive here and are automatically attached to the matching lead."
      />

      <Card bordered={false}>
        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 760 }}
          pagination={{ current: params.page, pageSize: params.limit, total: data?.meta?.total || 0, onChange: (page, limit) => setParams({ page, limit }) }}
        />
      </Card>

      <Modal
        open={editing !== null} title={editing?.id ? 'Edit POP account' : 'Add POP account'}
        onCancel={() => { setEditing(null); form.resetFields(); }} onOk={() => form.submit()}
        confirmLoading={saveMut.isPending} okText="Save" destroyOnClose width={720}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Form.Item name="campaign_id" label="Campaign" rules={[{ required: true, message: 'Select the campaign this mailbox belongs to' }]}
            tooltip="Each campaign has exactly one POP mailbox (and one mother mail) for lead replies.">
            <Select showSearch optionFilterProp="label" placeholder="Select campaign"
              options={(campaigns || []).map((c) => ({ value: c.id, label: c.campaign_name }))} />
          </Form.Item>
          <Form.Item name="label" label="Label"><Input placeholder="e.g. Sales replies" /></Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item name="host" label="Host" rules={[{ required: true }]}><Input placeholder="pop.gmail.com" /></Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="port" label="Port"><InputNumber min={1} max={65535} placeholder="995" style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="encryption" label="Encryption" initialValue="ssl">
            <Select placeholder="Select encryption" options={['ssl', 'tls', 'none'].map((v) => ({ value: v, label: v.toUpperCase() }))} />
          </Form.Item>
          <Form.Item name="username" label="Username (email)" rules={[{ required: true }]}><Input placeholder="replies@yourdomain.com" /></Form.Item>
          <Form.Item name="password" label="Password" rules={editing?.id ? [] : [{ required: true }]}>
            <Input.Password placeholder={editing?.id ? 'Leave blank to keep current' : 'Mailbox password / app password'} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

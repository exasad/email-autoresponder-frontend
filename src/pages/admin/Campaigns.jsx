import React, { useState } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Card, Modal, Form, InputNumber, DatePicker, App, Dropdown, Row, Col,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, MoreOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import { adminApi } from '../../api/client';
import { date, fromNow } from '../../lib/format';

const STATUS = { active: 'success', paused: 'warning', expired: 'error', draft: 'default' };

export default function Campaigns() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: undefined, userId: undefined });
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'campaigns', params],
    queryFn: async () => (await adminApi.get('/campaigns', { params })).data,
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: async () => (await adminApi.get('/users', { params: { limit: 200 } })).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });

  const saveMut = useMutation({
    mutationFn: (v) => {
      const payload = { ...v, expire_date: v.expire_date ? v.expire_date.format('YYYY-MM-DD') : null };
      return v.id ? adminApi.patch(`/campaigns/${v.id}`, payload) : adminApi.post('/campaigns', payload);
    },
    onSuccess: () => { message.success('Saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (row) => {
    setEditing(row || {});
    form.setFieldsValue(row
      ? { ...row, user_id: row.user_id, expire_date: row.expire_date ? dayjs(row.expire_date) : null }
      : { daily_limit: 100, status: 'draft' });
  };

  const columns = [
    { title: 'Campaign', render: (_, r) => <div><div style={{ fontWeight: 600 }}>{r.campaign_name}</div>{r.model_name && <div style={{ fontSize: 12, opacity: 0.6 }}>From: {r.model_name}</div>}</div> },
    { title: 'Owner', render: (_, r) => r.user ? <div><div>{r.user.name}</div><div style={{ fontSize: 12, opacity: 0.6 }}>{r.user.email}</div></div> : '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag> },
    { title: 'Daily', dataIndex: 'daily_limit', render: (v, r) => `${r.sent_today || 0} / ${v}` },
    { title: 'Expires', dataIndex: 'expire_date', render: (v) => v ? date(v) : 'never' },
    { title: 'Created', dataIndex: 'created_at', render: (v) => fromNow(v) },
    {
      title: '', width: 48, align: 'right',
      render: (_, r) => (
        <Dropdown trigger={['click']} menu={{
          items: [
            { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
            { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
          ],
          onClick: ({ key }) => {
            if (key === 'edit') openEdit(r);
            if (key === 'delete') modal.confirm({
              title: `Delete "${r.campaign_name}"?`, okType: 'danger',
              content: 'Removes its mother mail, replies, follow-ups and leads.',
              onOk: () => adminApi.delete(`/campaigns/${r.id}`).then(() => { message.success('Deleted'); invalidate(); }),
            });
          },
        }}><Button type="text" icon={<MoreOutlined />} /></Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="All campaigns across every user"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>New campaign</Button>}
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search campaigns" style={{ width: 240 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))} />
          <Select allowClear placeholder="Owner" style={{ width: 220 }} showSearch optionFilterProp="label"
            options={(users || []).map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            onChange={(userId) => setParams((p) => ({ ...p, page: 1, userId }))} />
          <Select allowClear placeholder="Status" style={{ width: 150 }}
            options={['active', 'paused', 'expired', 'draft'].map((v) => ({ value: v, label: v }))}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))} />
        </Space>

        <Table
          rowKey="id" loading={isFetching} columns={columns} dataSource={data?.data || []} scroll={{ x: 900 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showTotal: (t) => `${t} campaigns`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      <Modal
        open={editing !== null}
        title={editing?.id ? 'Edit campaign' : 'New campaign'}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText="Save"
        destroyOnClose
        width={760}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Form.Item name="user_id" label="Owner (user)" rules={[{ required: true, message: 'Select an owner' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select the owning user" disabled={!!editing?.id}
              options={(users || []).map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="campaign_name" label="Campaign name" rules={[{ required: true }]}><Input placeholder="Q3 Outreach" /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="model_name" label="Model name (From name)" tooltip="Shown as the sender name on outbound emails">
                <Input placeholder="Sarah from Acme" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reply_to_email" label="Reply-To email" tooltip="Where lead replies are directed; falls back to a POP mailbox if empty"
            rules={[{ type: 'email', message: 'Enter a valid email' }]}>
            <Input placeholder="replies@yourdomain.com" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="daily_limit" label="Daily limit" rules={[{ required: true }]}><InputNumber min={1} max={100000} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="expire_date" label="Expiry date"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="status" label="Status" initialValue="draft">
                <Select options={['draft', 'active', 'paused'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="additional_notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

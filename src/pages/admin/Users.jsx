import React, { useState } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Dropdown, Modal, Form, InputNumber,
  App, Avatar, Popconfirm, Card, Descriptions, Statistic, Row, Col,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, MoreOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, DeleteOutlined, KeyOutlined, BarChartOutlined, LoginOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { adminApi, writeSession } from '../../api/client';
import { dateTime, fromNow } from '../../lib/format';

const STATUS_COLORS = { active: 'success', suspended: 'error', pending: 'warning' };

export default function Users() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [params, setParams] = useState({ page: 1, limit: 10, search: '', status: undefined });
  const [editing, setEditing] = useState(null); // null | {} (new) | user (edit)
  const [statsUser, setStatsUser] = useState(null);
  const [form] = Form.useForm();

  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => (await adminApi.get('/users', { params })).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });

  const saveMut = useMutation({
    mutationFn: (values) => (values.id
      ? adminApi.patch(`/users/${values.id}`, values)
      : adminApi.post('/users', values)),
    onSuccess: () => { message.success('Saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const actionMut = useMutation({
    mutationFn: ({ id, action }) => adminApi.post(`/users/${id}/${action}`),
    onSuccess: () => { message.success('Updated'); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.delete(`/users/${id}`),
    onSuccess: () => { message.success('User deleted'); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const resetMut = useMutation({
    mutationFn: (id) => adminApi.post(`/users/${id}/reset-password`, {}),
    onSuccess: ({ data }) => modal.success({
      title: 'Password reset',
      content: <span>New temporary password: <b>{data.data.password}</b><br />Share it securely with the user.</span>,
    }),
    onError: (e) => message.error(e.apiMessage),
  });

  // Impersonate: mint a user session and open the user panel in a new tab.
  const impersonateMut = useMutation({
    mutationFn: (id) => adminApi.post(`/users/${id}/login-as`),
    onSuccess: ({ data }) => {
      writeSession('user', {
        token: data.data.token,
        refreshToken: data.data.refreshToken,
        profile: data.data.user,
      });
      window.open('/user', '_blank', 'noopener');
    },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (user) => {
    setEditing(user || {});
    form.setFieldsValue(user || { status: 'active' });
  };

  const columns = [
    {
      title: 'User', dataIndex: 'name',
      render: (_, r) => (
        <Space>
          <Avatar src={r.avatar_url} style={{ background: '#4f46e5' }}>{(r.name || '?')[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{r.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Company', dataIndex: 'company', render: (v) => v || '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS_COLORS[s]} style={{ textTransform: 'capitalize' }}>{s}</Tag> },
    { title: 'Limits', render: (_, r) => (
      <span style={{ fontSize: 12 }}>
        {r.campaign_limit != null ? `${r.campaign_limit} campaigns` : '∞ campaigns'}<br />
        {r.daily_send_limit != null ? `${r.daily_send_limit}/day` : 'no daily cap'}
      </span>
    ) },
    { title: 'Last login', dataIndex: 'last_login_at', render: (v) => v ? fromNow(v) : 'never' },
    {
      title: '', width: 48, align: 'right',
      render: (_, r) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'login-as', icon: <LoginOutlined />, label: 'Log in as user (new tab)' },
              { key: 'edit', icon: <EditOutlined />, label: 'Edit' },
              { key: 'stats', icon: <BarChartOutlined />, label: 'Statistics' },
              { key: 'reset', icon: <KeyOutlined />, label: 'Reset password' },
              r.status === 'active'
                ? { key: 'suspend', icon: <StopOutlined />, label: 'Suspend', danger: true }
                : { key: 'activate', icon: <CheckCircleOutlined />, label: 'Activate' },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'login-as') impersonateMut.mutate(r.id);
              if (key === 'edit') openEdit(r);
              if (key === 'stats') setStatsUser(r);
              if (key === 'reset') resetMut.mutate(r.id);
              if (key === 'suspend') actionMut.mutate({ id: r.id, action: 'suspend' });
              if (key === 'activate') actionMut.mutate({ id: r.id, action: 'activate' });
              if (key === 'delete') modal.confirm({
                title: `Delete ${r.name}?`,
                content: 'This permanently removes the user and all their campaigns and leads.',
                okType: 'danger', okText: 'Delete',
                onOk: () => deleteMut.mutateAsync(r.id),
              });
            },
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Create and manage customer accounts"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>New user</Button>}
      />

      <Card bordered={false} styles={{ body: { paddingTop: 16 } }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear prefix={<SearchOutlined />} placeholder="Search name, email, company"
            style={{ width: 280 }}
            onChange={(e) => setParams((p) => ({ ...p, page: 1, search: e.target.value }))}
          />
          <Select
            allowClear placeholder="Status" style={{ width: 160 }}
            options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'pending', label: 'Pending' }]}
            onChange={(status) => setParams((p) => ({ ...p, page: 1, status }))}
          />
        </Space>

        <Table
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={data?.data || []}
          scroll={{ x: 720 }}
          pagination={{
            current: params.page, pageSize: params.limit, total: data?.meta?.total || 0,
            showSizeChanger: true, showTotal: (t) => `${t} users`,
            onChange: (page, limit) => setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={editing !== null}
        title={editing?.id ? 'Edit user' : 'Create user'}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText="Save"
        destroyOnClose
        width={680}
        style={{ maxWidth: 'calc(100vw - 16px)' }}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input placeholder="Jane Cooper" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="jane@company.com" disabled={!!editing?.id} />
          </Form.Item>
          {!editing?.id && (
            <Form.Item name="password" label="Temporary password" rules={[{ required: true, min: 8 }]}>
              <Input.Password placeholder="At least 8 characters" />
            </Form.Item>
          )}
          <Form.Item name="company" label="Company"><Input placeholder="Acme Inc." /></Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'pending', label: 'Pending' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="campaign_limit" label="Campaign limit"><InputNumber min={0} style={{ width: '100%' }} placeholder="∞" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="daily_send_limit" label="Daily send limit"><InputNumber min={0} style={{ width: '100%' }} placeholder="No cap" /></Form.Item>
        </Form>
      </Modal>

      {/* Stats drawer/modal */}
      <UserStatsModal user={statsUser} onClose={() => setStatsUser(null)} />
    </>
  );
}

function UserStatsModal({ user, onClose }) {
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ['admin', 'user-stats', user?.id],
    queryFn: async () => (await adminApi.get(`/users/${user.id}/stats`)).data.data,
  });
  const s = data || {};
  const tiles = [
    ['Campaigns', s.campaigns], ['Active', s.activeCampaigns], ['POP accounts', s.popAccounts],
    ['Mother mails', s.motherMails], ['Leads', s.leads], ['Messages sent', s.messagesSent], ['Follow-ups sent', s.followupsSent],
  ];
  return (
    <Modal open={!!user} title={user ? `${user.name} · statistics` : ''} footer={null} onCancel={onClose} width={720} style={{ maxWidth: 'calc(100vw - 16px)' }}>
      <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
        <Descriptions.Item label="Joined">{dateTime(user?.created_at)}</Descriptions.Item>
      </Descriptions>
      <Row gutter={[12, 12]}>
        {tiles.map(([label, value]) => (
          <Col xs={12} sm={8} key={label}>
            <Card size="small" bordered><Statistic title={label} value={value ?? 0} loading={isLoading} /></Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
}

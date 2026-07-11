import React, { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Space, Tag, App, Alert, Descriptions } from 'antd';
import { ThunderboltOutlined, SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/client';
import { fromNow } from '../lib/format';

/**
 * Mother mail configuration for a campaign. Per spec the record is only saved
 * once the POP connection succeeds, and the email must be globally unique.
 */
export default function MotherMailPanel({ campaignId }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const key = ['mother-mail', campaignId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => (await userApi.get(`/campaigns/${campaignId}/mother-mail`)).data.data,
  });

  useEffect(() => {
    if (data) form.setFieldsValue({ ...data, password: undefined });
  }, [data, form]);

  const testMut = useMutation({
    mutationFn: (v) => userApi.post(`/campaigns/${campaignId}/mother-mail/test`, v),
    onSuccess: ({ data: r }) => (r.data.ok ? message.success(r.data.message) : message.error(r.data.message)),
    onError: (e) => message.error(e.apiMessage),
  });

  const saveMut = useMutation({
    mutationFn: (v) => userApi.put(`/campaigns/${campaignId}/mother-mail`, v),
    onSuccess: () => { message.success('Mother mail saved (POP verified)'); qc.invalidateQueries({ queryKey: key }); },
    onError: (e) => message.error(e.apiMessage),
  });

  return (
    <Card bordered={false} loading={isLoading}>
      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="The mother mailbox receives your prospects' first emails. New leads are created from today's unique senders; the campaign's first message is then scheduled automatically."
      />

      {data && (
        <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Connection">
            <Tag color={data.connection_status === 'connected' ? 'success' : data.connection_status === 'failed' ? 'error' : 'default'}>
              {data.connection_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Last connected">{data.last_connected_at ? fromNow(data.last_connected_at) : 'never'}</Descriptions.Item>
        </Descriptions>
      )}

      <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
        <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Form.Item name="email_address" label="Email address" rules={[{ required: true, type: 'email' }]} style={{ minWidth: 280 }}>
            <Input placeholder="inbox@yourdomain.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={data ? [] : [{ required: true }]} style={{ minWidth: 220 }}>
            <Input.Password placeholder={data ? 'Leave blank to keep current' : ''} />
          </Form.Item>
        </Space>
        <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Form.Item name="pop_host" label="POP host" rules={[{ required: true }]} style={{ minWidth: 240 }}>
            <Input placeholder="pop.yourdomain.com" />
          </Form.Item>
          <Form.Item name="pop_port" label="Port" initialValue={995}><InputNumber min={1} max={65535} placeholder="995" style={{ width: 120 }} /></Form.Item>
          <Form.Item name="encryption" label="Encryption" initialValue="ssl">
            <Select placeholder="Select encryption" style={{ width: 140 }} options={['ssl', 'tls', 'none'].map((v) => ({ value: v, label: v.toUpperCase() }))} />
          </Form.Item>
        </Space>

        <Space>
          <Button icon={<ThunderboltOutlined />} loading={testMut.isPending}
            onClick={() => testMut.mutate(form.getFieldsValue())}>Test connection</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saveMut.isPending}>
            Save (verifies POP first)
          </Button>
        </Space>
      </Form>
    </Card>
  );
}

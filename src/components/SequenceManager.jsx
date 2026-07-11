import React, { useState } from 'react';
import {
  List, Button, Tag, Space, Modal, Form, InputNumber, Select, App, Empty, Typography, Tooltip,
  Row, Col, Alert, Progress,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ClockCircleOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';

const SPAM_COLOR = { good: '#10b981', warning: '#f59e0b', high: '#ef4444' };
const SPAM_LABEL = { good: 'Inbox-friendly', warning: 'Needs work', high: 'High spam risk' };
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RichTextEditor from './RichTextEditor';
import AttachmentUpload from './AttachmentUpload';
import { userApi } from '../api/client';

/** Plain-text snippet from an HTML body, for list previews. */
function snippet(html, n = 90) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > n ? `${text.slice(0, n)}…` : text || '(empty)';
}

/**
 * Manages an ordered sequence of emails (replies OR follow-ups). `base` is the
 * REST path, e.g. `/campaigns/12/messages`. There is NO subject field — the
 * outbound subject is always taken from the lead's inbound email.
 */
export default function SequenceManager({ base, label, queryKey }) {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [spam, setSpam] = useState(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => (await userApi.get(base)).data.data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const saveMut = useMutation({
    mutationFn: (v) => (v.id ? userApi.patch(`${base}/${v.id}`, v) : userApi.post(base, v)),
    onSuccess: () => { message.success('Saved'); setEditing(null); form.resetFields(); invalidate(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const openEdit = (item) => {
    setEditing(item || {});
    form.setFieldsValue(item || { delay_time: 0, delay_type: 'minutes', status: 'active', body: '' });
  };

  const doPreview = async () => {
    const values = form.getFieldsValue();
    const { data: res } = await userApi.post(`${base}/preview`, { body: values.body })
      .catch(() => ({ data: { data: { body: values.body } } }));
    setPreview(res.data);
  };

  const doSpamCheck = async () => {
    const values = form.getFieldsValue();
    if (!values.body) { message.warning('Write the message body first'); return; }
    const { data: res } = await userApi.post('/spam-check', { body: values.body });
    setSpam(res.data);
  };

  const items = data || [];

  return (
    <>
      <Alert
        type="info" showIcon style={{ marginBottom: 12 }}
        message={`The subject is automatically taken from the lead's inbound email (Re: …) — you only write the ${label.toLowerCase()} body.`}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Text type="secondary">
          {items.length} {label.toLowerCase()}{items.length === 1 ? '' : 's'} · sent in sequence order
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit(null)}>Add {label.toLowerCase()}</Button>
      </div>

      {items.length === 0 && !isLoading ? (
        <Empty description={`No ${label.toLowerCase()}s yet`} />
      ) : (
        <List
          loading={isLoading}
          dataSource={items}
          renderItem={(it) => (
            <List.Item
              style={{ background: 'var(--ant-color-bg-container)', borderRadius: 12, marginBottom: 10, padding: 16, border: '1px solid var(--ant-color-border-secondary)' }}
              actions={[
                <Tooltip title="Preview" key="p"><Button type="text" icon={<EyeOutlined />} onClick={async () => { setPreview(null); const { data: res } = await userApi.post(`${base}/preview`, { body: it.body }); setPreview(res.data); }} /></Tooltip>,
                <Button type="text" icon={<EditOutlined />} key="e" onClick={() => openEdit(it)} />,
                <Button type="text" danger icon={<DeleteOutlined />} key="d" onClick={() => modal.confirm({ title: 'Delete this item?', okType: 'danger', onOk: () => userApi.delete(`${base}/${it.id}`).then(() => { message.success('Deleted'); invalidate(); }) })} />,
              ]}
            >
              <List.Item.Meta
                avatar={<Tag color="blue" style={{ borderRadius: 20, marginTop: 4 }}>#{it.sequence_number}</Tag>}
                title={<Space wrap>{label} {it.sequence_number} <Tag color={it.status === 'active' ? 'success' : 'default'}>{it.status}</Tag></Space>}
                description={(
                  <span>
                    <Space size={4}><ClockCircleOutlined /> delay {it.delay_time} {it.delay_type} after previous step</Space>
                    <div style={{ marginTop: 4, opacity: 0.7 }}>{snippet(it.body)}</div>
                  </span>
                )}
              />
            </List.Item>
          )}
        />
      )}

      {/* Editor modal */}
      <Modal
        open={editing !== null}
        title={editing?.id ? `Edit ${label}` : `New ${label}`}
        width={920}
        style={{ maxWidth: 'calc(100vw - 16px)', top: 24 }}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={saveMut.isPending}
        okText="Save"
        destroyOnClose
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space wrap>
            <Button icon={<SafetyCertificateOutlined />} onClick={doSpamCheck}>Check spam</Button>
            <Button icon={<EyeOutlined />} onClick={doPreview}>Preview</Button>
            <CancelBtn /><OkBtn />
          </Space>
        )}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate({ ...v, id: editing?.id })} style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col xs={8} sm={8}>
              <Form.Item name="sequence_number" label="Sequence #"><InputNumber min={1} placeholder="e.g. 1" style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={8} sm={8}>
              <Form.Item name="delay_time" label="Delay" initialValue={0}><InputNumber min={0} placeholder="e.g. 30" style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col xs={8} sm={8}>
              <Form.Item name="delay_type" label="Unit" initialValue="minutes">
                <Select placeholder="Select unit" options={['minutes', 'hours', 'days'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="body" label={`${label} body`} rules={[{ required: true, message: 'Body is required' }]}>
            <RichTextEditor api={userApi} />
          </Form.Item>
          <Form.Item name="attachments" label="Attachments (images & videos)" tooltip="Multiple images/videos sent along with this email">
            <AttachmentUpload api={userApi} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview modal */}
      <Modal open={!!preview} title="Preview (sample lead data)" footer={null} onCancel={() => setPreview(null)} width={680} style={{ maxWidth: 'calc(100vw - 16px)' }}>
        {preview && (
          <>
            <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.7 }}>Subject: (Re: the lead's inbound subject)</div>
            <div style={{ border: '1px solid var(--ant-color-border-secondary)', borderRadius: 8, padding: 16 }}
              dangerouslySetInnerHTML={{ __html: preview.body }} />
          </>
        )}
      </Modal>

      {/* Spam-check modal */}
      <Modal open={!!spam} title="Spam check" footer={null} onCancel={() => setSpam(null)} width={560} style={{ maxWidth: 'calc(100vw - 16px)' }}>
        {spam && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
              <Progress
                type="dashboard" percent={spam.score} size={120}
                strokeColor={SPAM_COLOR[spam.level]}
                format={(p) => <span style={{ fontSize: 22 }}>{p}<span style={{ fontSize: 12, opacity: 0.6 }}>/100</span></span>}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <Tag color={spam.level === 'good' ? 'success' : spam.level === 'warning' ? 'warning' : 'error'} style={{ fontSize: 13 }}>
                  {SPAM_LABEL[spam.level]}
                </Tag>
                <div style={{ marginTop: 8 }}>{spam.summary}</div>
                <div style={{ fontSize: 12, opacity: 0.55, marginTop: 8 }}>
                  {spam.wordCount} words · {spam.linkCount} links · {spam.imageCount} images
                </div>
              </div>
            </div>
            <List
              size="small"
              dataSource={spam.issues}
              locale={{ emptyText: 'No issues found 🎉' }}
              renderItem={(i) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Tag color={i.severity === 'good' ? 'success' : i.severity === 'warning' ? 'warning' : 'error'} style={{ marginTop: 4 }}>{i.severity}</Tag>}
                    title={<span style={{ fontSize: 13 }}>{i.message}</span>}
                    description={i.suggestion}
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </>
  );
}

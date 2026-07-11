import React, { useState } from 'react';
import {
  Row, Col, Card, Form, Input, Button, Avatar, Upload, App, Typography, Divider,
} from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import PageHeader from './PageHeader';

/**
 * Shared profile screen for both portals. `fields` lists the editable profile
 * inputs; `api` + `onProfileUpdated` wire it to the correct portal.
 */
export default function ProfilePage({ portal, api, profile, fields, onProfileUpdated }) {
  const { message } = App.useApp();
  const [profileForm] = Form.useForm();
  const [pwForm] = Form.useForm();
  const [avatar, setAvatar] = useState(profile?.avatar_url);

  const saveProfile = useMutation({
    mutationFn: (values) => api.patch('/profile', { ...values, avatar_url: avatar }),
    onSuccess: ({ data }) => {
      message.success('Profile updated');
      onProfileUpdated?.(data.data[portal] || data.data.user || data.data.admin);
    },
    onError: (e) => message.error(e.apiMessage),
  });

  const changePw = useMutation({
    mutationFn: (values) => api.post('/profile/password', values),
    onSuccess: () => { message.success('Password changed'); pwForm.resetFields(); },
    onError: (e) => message.error(e.apiMessage),
  });

  const uploadProps = {
    name: 'file',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setAvatar(data.data.url);
        message.success('Image uploaded — save to apply');
        onSuccess(data);
      } catch (e) { message.error(e.apiMessage); onError(e); }
    },
  };

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your account details and security" />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ textAlign: 'center' }}>
            <Avatar size={96} src={avatar} icon={<UserOutlined />} style={{ background: '#4f46e5' }}>
              {(profile?.name || '?')[0]}
            </Avatar>
            <Typography.Title level={4} style={{ marginBottom: 0, marginTop: 12 }}>{profile?.name}</Typography.Title>
            <Typography.Text type="secondary">{profile?.email}</Typography.Text>
            <Divider />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Change photo</Button>
            </Upload>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Account details" bordered={false} style={{ marginBottom: 16 }}>
            <Form form={profileForm} layout="vertical" initialValues={profile} onFinish={(v) => saveProfile.mutate(v)}>
              <Row gutter={16}>
                {fields.map((f) => (
                  <Col xs={24} sm={12} key={f.name}>
                    <Form.Item name={f.name} label={f.label}>
                      <Input placeholder={f.placeholder} disabled={f.disabled} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              <Button type="primary" htmlType="submit" loading={saveProfile.isPending}>Save changes</Button>
            </Form>
          </Card>

          <Card title="Change password" bordered={false}>
            <Form form={pwForm} layout="vertical" onFinish={(v) => changePw.mutate(v)}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="newPassword" label="New password" rules={[{ required: true, min: 8 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={changePw.isPending}>Update password</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
}

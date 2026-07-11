import React, { useState } from 'react';
import {
  Modal, Upload, Button, App, Alert, Typography, Divider, Input, Space, Tag, List,
} from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

/**
 * Bulk SMTP import modal. Accepts an Excel/CSV file (columns:
 * email, password, recovery, appPassword) or pasted rows. `api` is the axios
 * instance (adminApi or userApi) whose /smtp/import endpoint is called.
 */
export default function SmtpImportModal({ open, onClose, api, onDone }) {
  const { message } = App.useApp();
  const [result, setResult] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResult = (data, msg) => {
    setResult(data);
    message.success(msg);
    onDone?.();
  };

  const uploadProps = {
    accept: '.xlsx,.csv',
    maxCount: 1,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/smtp/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        handleResult(data.data, data.message);
        onSuccess(data);
      } catch (e) { message.error(e.apiMessage || 'Import failed'); onError(e); }
    },
  };

  const importText = async () => {
    if (!text.trim()) { message.warning('Paste some rows first'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/smtp/import', { text });
      handleResult(data.data, data.message);
    } catch (e) { message.error(e.apiMessage || 'Import failed'); }
    finally { setLoading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/smtp/import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'smtp-import-template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { message.error('Could not download template'); }
  };

  const close = () => { setResult(null); setText(''); onClose(); };

  return (
    <Modal
      open={open} onCancel={close} footer={null} width={640}
      style={{ maxWidth: 'calc(100vw - 16px)' }}
      title="Import SMTP accounts"
    >
      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        message="Excel/CSV columns (in order): email, password, recovery, appPassword"
        description="Accounts are added as Gmail SMTP (smtp.gmail.com:587, TLS). SMTP auth uses the app password; the account password + recovery email are stored for reference. Duplicates (same email) are skipped."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} size="small" onClick={downloadTemplate}>Download Excel template</Button>
      </div>

      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Click or drag an <b>.xlsx</b> / <b>.csv</b> file here</p>
        <p className="ant-upload-hint" style={{ fontSize: 12 }}>
          <FileExcelOutlined /> One SMTP account per row
        </p>
      </Dragger>

      <Divider plain>or paste rows</Divider>
      <Input.TextArea
        rows={5} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={'email,password,recovery,appPassword\nsender@gmail.com,accpass,rec@x.com,abcd efgh ijkl mnop'}
      />
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <Button type="primary" loading={loading} onClick={importText}>Import pasted rows</Button>
      </div>

      {result && (
        <>
          <Divider />
          <Space wrap>
            <Tag color="success">Created: {result.created}</Tag>
            <Tag>Skipped: {result.skipped}</Tag>
            <Tag color="blue">Total: {result.total}</Tag>
          </Space>
          {result.errors?.length > 0 && (
            <List
              size="small" style={{ marginTop: 8, maxHeight: 160, overflow: 'auto' }}
              header={<Typography.Text type="secondary">Skipped rows</Typography.Text>}
              dataSource={result.errors}
              renderItem={(e) => <List.Item style={{ fontSize: 12, color: '#ef4444' }}>{e}</List.Item>}
            />
          )}
        </>
      )}
    </Modal>
  );
}

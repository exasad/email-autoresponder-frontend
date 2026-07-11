import React from 'react';
import { Upload, Button, App } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { userApi } from '../api/client';

/**
 * Controlled attachment uploader for replies/follow-ups. Accepts MULTIPLE
 * images and videos only. `value` is an array of stored attachment objects
 * ({ url, filename, originalName, size, mimetype }); files upload immediately
 * and the metadata is what gets saved on the message.
 */
export default function AttachmentUpload({ value = [], onChange, api = userApi }) {
  const { message } = App.useApp();

  const fileList = (value || []).map((a) => ({
    uid: a.filename || a.url,
    name: a.originalName || a.filename,
    status: 'done',
    url: a.url,
  }));

  // Client-side guard — only images/videos (the API enforces this too).
  const beforeUpload = (file) => {
    const ok = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!ok) {
      message.error(`${file.name}: only image and video files are allowed`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange?.([...(value || []), data.data]);
      onSuccess(data);
    } catch (e) {
      message.error(e.apiMessage || 'Upload failed');
      onError(e);
    }
  };

  const onRemove = (file) => {
    onChange?.((value || []).filter((a) => (a.filename || a.url) !== file.uid));
  };

  return (
    <Upload
      multiple
      accept="image/*,video/*"
      listType="picture"
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      onRemove={onRemove}
    >
      <Button icon={<PaperClipOutlined />}>Add images / videos</Button>
    </Upload>
  );
}

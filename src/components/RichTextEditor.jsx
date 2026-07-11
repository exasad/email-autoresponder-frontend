import React, { useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Dropdown, Button, Space, App, Tooltip, Tag, Typography } from 'antd';
import { TagOutlined, DownOutlined } from '@ant-design/icons';

// Built-in merge tags with human-readable descriptions (shown on hover).
const MERGE_TAGS = [
  { tag: 'first_name', label: 'First name', desc: "The lead's first name, parsed from their inbound email." },
  { tag: 'last_name', label: 'Last name', desc: "The lead's last name." },
  { tag: 'full_name', label: 'Full name', desc: "The lead's full name (first + last)." },
  { tag: 'email', label: 'Email', desc: "The lead's email address." },
  { tag: 'company', label: 'Company', desc: "The lead's company name, if known." },
  { tag: 'phone', label: 'Phone', desc: "The lead's phone number, if known." },
  { tag: 'website', label: 'Website', desc: "The lead's website, if known." },
  { tag: 'city', label: 'City', desc: "The lead's city." },
  { tag: 'country', label: 'Country', desc: "The lead's country." },
];

/**
 * Rich text editor for reply/follow-up bodies. Supports formatting, inline
 * image upload (toolbar + drag/drop) and merge tags. Merge tags can be inserted
 * from the toolbar dropdown OR the footer chips; hovering a tag shows what it
 * resolves to. Custom fields ({any_custom_field}) also work at send time.
 */
export default function RichTextEditor({ value, onChange, api }) {
  const quillRef = useRef(null);
  const { message } = App.useApp();

  const uploadAndInsert = useCallback(async (file) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      editor.insertEmbed(range.index, 'image', data.data.url);
      editor.setSelection(range.index + 1);
    } catch (e) {
      message.error(e.apiMessage || 'Image upload failed');
    }
  }, [api, message]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => Array.from(input.files || []).forEach(uploadAndInsert);
    input.click();
  }, [uploadAndInsert]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
    clipboard: { matchVisual: false },
  }), [imageHandler]);

  const insertTag = (tag) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true) || { index: editor.getLength() };
    editor.insertText(range.index, `{${tag}}`, 'user');
    editor.setSelection(range.index + tag.length + 2);
  };

  const tagMenu = {
    items: MERGE_TAGS.map((t) => ({
      key: t.tag,
      label: (
        <Tooltip title={t.desc} placement="right">
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 16, minWidth: 220 }}>
            <code>{`{${t.tag}}`}</code>
            <span style={{ opacity: 0.6 }}>{t.label}</span>
          </span>
        </Tooltip>
      ),
    })),
    onClick: ({ key }) => insertTag(key),
  };

  return (
    <div>
      <Space wrap style={{ marginBottom: 8 }}>
        <Dropdown menu={tagMenu} trigger={['click']}>
          <Button size="small" icon={<TagOutlined />}>Merge tags <DownOutlined /></Button>
        </Dropdown>
        <span style={{ fontSize: 12, opacity: 0.55 }}>Drag &amp; drop images directly into the editor</span>
      </Space>

      <ReactQuill ref={quillRef} theme="snow" value={value || ''} onChange={onChange} modules={modules} />

      {/* Merge-tag footer: click to insert, hover for a description. */}
      <div style={{ marginTop: 10 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Merge tags — click to insert into the message, hover to see what they mean:
        </Typography.Text>
        <div style={{ marginTop: 6 }}>
          <Space wrap size={[6, 6]}>
            {MERGE_TAGS.map((t) => (
              <Tooltip key={t.tag} title={t.desc}>
                <Tag color="blue" style={{ cursor: 'pointer', margin: 0 }} onClick={() => insertTag(t.tag)}>
                  {`{${t.tag}}`}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      </div>
    </div>
  );
}

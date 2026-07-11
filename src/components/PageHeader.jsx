import React from 'react';
import { Breadcrumb, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

/** Consistent page title + breadcrumb + right-aligned actions slot. */
export default function PageHeader({ title, subtitle, breadcrumb = [], extra }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumb.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 10 }}
          items={breadcrumb.map((b) => ({ title: b.to ? <Link to={b.to}>{b.label}</Link> : b.label }))}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{title}</Title>
          {subtitle && <Text type="secondary">{subtitle}</Text>}
        </div>
        {extra && <Space wrap>{extra}</Space>}
      </div>
    </div>
  );
}

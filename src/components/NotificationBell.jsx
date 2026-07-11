import React from 'react';
import { Badge, Button, Dropdown, List, Typography, Empty, Tag } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromNow } from '../lib/format';

const LEVEL_COLOR = { info: 'blue', success: 'green', warning: 'gold', error: 'red' };

/** Polls the portal's notifications and renders an unread badge + dropdown feed. */
export default function NotificationBell({ api }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications', api.defaults.baseURL],
    queryFn: async () => (await api.get('/notifications', { params: { limit: 8 } })).data,
    refetchInterval: 20_000,
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.data || [];
  const unread = data?.meta?.unread || 0;

  const dropdownRender = () => (
    <div style={{ width: 'min(360px, calc(100vw - 32px))', background: 'var(--ant-color-bg-elevated)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
        <Typography.Text strong>Notifications</Typography.Text>
        <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => markAll.mutate()} disabled={!unread}>
          Mark all read
        </Button>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You're all caught up" style={{ padding: 24 }} />
        ) : (
          <List
            dataSource={items}
            renderItem={(n) => (
              <List.Item style={{ padding: '10px 16px', background: n.read_at ? 'transparent' : 'var(--ant-color-fill-quaternary)' }}>
                <List.Item.Meta
                  title={<span style={{ fontSize: 13 }}>{n.title} <Tag color={LEVEL_COLOR[n.level]} style={{ marginLeft: 4 }}>{n.type.replace(/_/g, ' ')}</Tag></span>}
                  description={<span style={{ fontSize: 12 }}>{n.body}<br /><span style={{ opacity: 0.5 }}>{fromNow(n.created_at)}</span></span>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown dropdownRender={dropdownRender} trigger={['click']} placement="bottomRight">
      <Badge count={unread} size="small" offset={[-2, 4]}>
        <Button type="text" shape="circle" icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );
}

import React from 'react';
import { Card, Statistic, Skeleton, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/** KPI tile with an accent icon, optional trend, used across dashboards. */
export default function StatCard({ title, value, icon, tint = '#4f46e5', loading, suffix, trend, footer }) {
  const bg = `${tint}1f`; // ~12% alpha
  return (
    <Card bordered={false} style={{ boxShadow: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.1)' }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '50%' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Statistic title={title} value={value} suffix={suffix} valueStyle={{ fontWeight: 700, fontSize: 26 }} />
            {trend != null && (
              <Tag color={trend >= 0 ? 'success' : 'error'} style={{ marginTop: 8, borderRadius: 20 }}>
                {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend)}%
              </Tag>
            )}
            {footer && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>{footer}</div>}
          </div>
          {icon && (
            <div className="stat-card__icon" style={{ background: bg, color: tint }}>
              {icon}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

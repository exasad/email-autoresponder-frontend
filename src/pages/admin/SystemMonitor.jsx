import React from 'react';
import {
  Row, Col, Card, Progress, Statistic, Table, Tag, Typography, Descriptions, Empty,
} from 'antd';
import {
  DesktopOutlined, DatabaseOutlined, HddOutlined, ThunderboltOutlined, ClusterOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { adminApi } from '../../api/client';
import { bytes, duration, number, fromNow } from '../../lib/format';

const usageColor = (p) => (p >= 85 ? '#ef4444' : p >= 60 ? '#f59e0b' : '#10b981');

export default function SystemMonitor() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'system'],
    queryFn: async () => (await adminApi.get('/system')).data.data,
    refetchInterval: 4000,
  });

  const m = data || {};
  const cpu = m.cpu || {};
  const mem = m.memory || {};
  const disk = m.disk;
  const proc = m.process || {};
  const dbi = m.database || {};
  const queue = m.queue || {};
  const workers = m.workers || { jobs: [] };
  const osi = m.os || {};

  return (
    <>
      <PageHeader
        title="Server Monitor"
        subtitle={osi.hostname ? `${osi.hostname} · ${osi.type} ${osi.release} (${osi.arch}) · up ${duration(osi.uptimeSec)}` : 'Live server & application health'}
      />

      {/* Top gauges */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} loading={isLoading}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress type="dashboard" percent={Math.round(cpu.usagePercent || 0)} strokeColor={usageColor(cpu.usagePercent || 0)} size={110} />
              <div>
                <Typography.Text type="secondary"><DesktopOutlined /> CPU</Typography.Text>
                <div style={{ fontWeight: 600 }}>{cpu.cores} threads</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Load {cpu.loadAvg?.['1m']?.toFixed?.(2) ?? '0.00'}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} loading={isLoading}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress type="dashboard" percent={Math.round(mem.usedPercent || 0)} strokeColor={usageColor(mem.usedPercent || 0)} size={110} />
              <div>
                <Typography.Text type="secondary"><ClusterOutlined /> RAM</Typography.Text>
                <div style={{ fontWeight: 600 }}>{bytes(mem.used)} / {bytes(mem.total)}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{bytes(mem.free)} free</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} loading={isLoading}>
            {disk ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Progress type="dashboard" percent={Math.round(disk.usedPercent || 0)} strokeColor={usageColor(disk.usedPercent || 0)} size={110} />
                <div>
                  <Typography.Text type="secondary"><HddOutlined /> Disk</Typography.Text>
                  <div style={{ fontWeight: 600 }}>{bytes(disk.used)} / {bytes(disk.total)}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{bytes(disk.free)} free</div>
                </div>
              </div>
            ) : <Empty description="Disk stats unavailable" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Per-core */}
        <Col xs={24} lg={12}>
          <Card title={`Per-core utilization · ${cpu.model || ''}`} bordered={false} loading={isLoading}>
            <Row gutter={[10, 10]}>
              {(cpu.perCore || []).map((p, i) => (
                <Col span={12} key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 44, fontSize: 12, opacity: 0.6 }}>Core {i}</span>
                    <Progress percent={Math.round(p)} size="small" strokeColor={usageColor(p)} />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Process */}
        <Col xs={24} lg={12}>
          <Card title="Node process" bordered={false} loading={isLoading}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}><Statistic title="PID" value={proc.pid} /></Col>
              <Col xs={12} sm={8}><Statistic title="Uptime" value={duration(proc.uptimeSec)} /></Col>
              <Col xs={12} sm={8}><Statistic title="Node" value={proc.nodeVersion} /></Col>
              <Col xs={12} sm={8}><Statistic title="RSS" value={bytes(proc.rss)} /></Col>
              <Col xs={12} sm={8}><Statistic title="Heap used" value={bytes(proc.heapUsed)} /></Col>
              <Col xs={12} sm={8}><Statistic title="Thread pool" value={proc.threadPoolSize} suffix="libuv" /></Col>
              <Col xs={12} sm={8}><Statistic title="Handles" value={proc.activeHandles ?? '—'} /></Col>
              <Col xs={12} sm={8}><Statistic title="Requests" value={proc.activeRequests ?? '—'} /></Col>
              <Col xs={12} sm={8}><Statistic title="Heap limit" value={bytes(proc.heapLimit)} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* DB + Queue */}
        <Col xs={24} lg={10}>
          <Card title={<><DatabaseOutlined /> Database</>} bordered={false} loading={isLoading}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={dbi.connected ? 'success' : 'error'}>{dbi.connected ? 'connected' : 'down'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Dialect">{dbi.dialect} · {dbi.database}</Descriptions.Item>
              <Descriptions.Item label="Latency">{dbi.latencyMs} ms</Descriptions.Item>
              {dbi.pool && <Descriptions.Item label="Pool">size {dbi.pool.size} · using {dbi.pool.using} · free {dbi.pool.available}</Descriptions.Item>}
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary">Email queue</Typography.Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <Tag color="processing">queued {number(queue.queued)}</Tag>
                <Tag color="warning">processing {number(queue.processing)}</Tag>
                <Tag color="success">sent {number(queue.sent)}</Tag>
                <Tag color="error">failed {number(queue.failed)}</Tag>
                <Tag>cancelled {number(queue.cancelled)}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Cron / workers */}
        <Col xs={24} lg={14}>
          <Card title={<><ThunderboltOutlined /> Cron & background workers</>} bordered={false} loading={isLoading}>
            <Tag color={workers.started ? 'success' : 'default'} style={{ marginBottom: 12 }}>
              {workers.started ? 'workers running' : 'workers stopped'}
            </Tag>
            <Table
              rowKey="name" size="small" pagination={false} scroll={{ x: 640 }}
              dataSource={workers.jobs || []}
              columns={[
                { title: 'Job', dataIndex: 'name', render: (v) => <b style={{ textTransform: 'capitalize' }}>{v}</b> },
                { title: 'Schedule', dataIndex: 'cron', render: (v) => <code style={{ fontSize: 12 }}>{v || '—'}</code> },
                { title: 'Runs', dataIndex: 'runs' },
                { title: 'State', dataIndex: 'running', render: (r) => <Tag color={r ? 'processing' : 'default'}>{r ? 'running' : 'idle'}</Tag> },
                { title: 'Last run', dataIndex: 'lastRunAt', render: (v) => v ? fromNow(v) : 'never' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

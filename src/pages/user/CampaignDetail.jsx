import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Tag, Descriptions, Skeleton } from 'antd';
import {
  MailOutlined, MessageOutlined, RetweetOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { userApi } from '../../api/client';
import { date } from '../../lib/format';

const STATUS = { active: 'success', paused: 'warning', expired: 'error', draft: 'default' };

/** Read-only campaign overview + shortcuts to the user-managed sub-modules. */
export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => (await userApi.get(`/campaigns/${id}`)).data.data,
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  const counts = campaign?.counts || {};
  const links = [
    { label: 'Mother Mail', icon: <MailOutlined />, to: `/user/mother-mail?campaign=${id}`, desc: 'Inbox that receives new leads' },
    { label: 'Replies', icon: <MessageOutlined />, to: `/user/replies?campaign=${id}`, desc: `${counts.messages || 0} in sequence` },
    { label: 'Follow-ups', icon: <RetweetOutlined />, to: `/user/followups?campaign=${id}`, desc: `${counts.followups || 0} scheduled` },
  ];

  return (
    <>
      <PageHeader
        title={campaign.campaign_name}
        subtitle={campaign.model_name ? `Sends as "${campaign.model_name}"` : 'Campaign overview'}
        breadcrumb={[{ label: 'Campaigns', to: '/user/campaigns' }, { label: campaign.campaign_name }]}
        extra={<Tag color={STATUS[campaign.status]} style={{ textTransform: 'capitalize', fontSize: 13, padding: '2px 10px' }}>{campaign.status}</Tag>}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card bordered={false}>
            <Descriptions title="Campaign details" column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label="Name">{campaign.campaign_name}</Descriptions.Item>
              <Descriptions.Item label="From name (model)">{campaign.model_name || '— (SMTP default)'}</Descriptions.Item>
              <Descriptions.Item label="Reply-To">{campaign.reply_to_email || '— (POP mailbox)'}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={STATUS[campaign.status]}>{campaign.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Daily limit">{campaign.sent_today || 0} / {campaign.daily_limit}</Descriptions.Item>
              <Descriptions.Item label="Expires">{campaign.expire_date ? date(campaign.expire_date) : 'never'}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{campaign.additional_notes || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            <Row gutter={[12, 12]}>
              <Col span={8}><Statistic title="Replies" value={counts.messages || 0} /></Col>
              <Col span={8}><Statistic title="Follow-ups" value={counts.followups || 0} /></Col>
              <Col span={8}><Statistic title="Leads" value={counts.leads || 0} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {links.map((l) => (
          <Col xs={24} sm={8} key={l.label}>
            <Card hoverable bordered={false} onClick={() => navigate(l.to)}
              styles={{ body: { display: 'flex', alignItems: 'center', gap: 12 } }}>
              <div className="stat-card__icon" style={{ background: '#4f46e51f', color: '#4f46e5' }}>{l.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{l.label}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{l.desc}</div>
              </div>
              <ArrowRightOutlined style={{ opacity: 0.4 }} />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}

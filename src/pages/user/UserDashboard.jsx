import React, { useState } from 'react';
import { Row, Col } from 'antd';
import {
  MailOutlined, SendOutlined, RetweetOutlined,
  ClockCircleOutlined, HourglassOutlined, RocketOutlined, ContactsOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DateRangeFilter from '../../components/DateRangeFilter';
import { userApi } from '../../api/client';
import { number } from '../../lib/format';

export default function UserDashboard() {
  const [range, setRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);

  const params = { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') };
  const { data, isLoading } = useQuery({
    queryKey: ['user', 'dashboard', params],
    queryFn: async () => (await userApi.get('/dashboard', { params })).data.data,
    refetchInterval: 60_000,
  });

  const t = data?.totals || {};
  const cards = [
    { title: 'Mother Mails', value: number(t.motherMails), icon: <MailOutlined />, tint: '#8b5cf6' },
    { title: 'Sent Replies', value: number(t.sentMessages), icon: <SendOutlined />, tint: '#10b981' },
    { title: 'Sent Follow-ups', value: number(t.sentFollowups), icon: <RetweetOutlined />, tint: '#ec4899' },
    { title: 'Waiting Replies', value: number(t.waitingMessages), icon: <ClockCircleOutlined />, tint: '#f59e0b' },
    { title: 'Waiting Follow-ups', value: number(t.waitingFollowups), icon: <HourglassOutlined />, tint: '#f97316' },
    { title: 'Active Campaigns', value: number(t.activeCampaigns), icon: <RocketOutlined />, tint: '#22c55e' },
    { title: 'Leads Received', value: number(t.leadsReceived), icon: <ContactsOutlined />, tint: '#0ea5e9' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your campaign performance for the selected period"
        extra={(
          <DateRangeFilter
            value={range}
            allowClear={false}
            onChange={(r) => r && r[0] && r[1] && setRange(r)}
          />
        )}
      />

      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} md={6} key={c.title}>
            <StatCard {...c} loading={isLoading} />
          </Col>
        ))}
      </Row>
    </>
  );
}

import React from 'react';
import { Select, Empty, Card, Skeleton, Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import { userApi } from '../api/client';

/**
 * Wrapper for campaign-scoped pages (Mother Mail, Replies, Follow-ups). Renders
 * a campaign picker in the header and calls `children(campaignId, campaign)` for
 * the selected campaign. Selection persists in the URL (?campaign=id) so links
 * from the campaigns list deep-link straight to the right campaign.
 */
export default function CampaignScoped({ title, subtitle, children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', 'picker'],
    queryFn: async () => (await userApi.get('/campaigns', { params: { limit: 200 } })).data.data,
  });

  const campaigns = data || [];
  const urlId = searchParams.get('campaign');
  const selectedId = urlId || (campaigns[0] ? String(campaigns[0].id) : undefined);
  const selected = campaigns.find((c) => String(c.id) === String(selectedId));

  const picker = (
    <Select
      showSearch optionFilterProp="label"
      style={{ minWidth: 220, maxWidth: '100%' }}
      placeholder="Select campaign"
      value={selected ? String(selected.id) : undefined}
      onChange={(id) => setSearchParams({ campaign: id })}
      options={campaigns.map((c) => ({ value: String(c.id), label: c.campaign_name }))}
    />
  );

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} extra={campaigns.length > 0 ? picker : null} />
      {isLoading ? (
        <Card bordered={false}><Skeleton active paragraph={{ rows: 6 }} /></Card>
      ) : campaigns.length === 0 ? (
        <Card bordered={false}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Create a campaign first to configure this"
          >
            <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/user/campaigns')}>
              Go to Campaigns
            </Button>
          </Empty>
        </Card>
      ) : (
        children(selected.id, selected)
      )}
    </>
  );
}

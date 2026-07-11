import React from 'react';
import { Card } from 'antd';
import CampaignScoped from '../../components/CampaignScoped';
import SequenceManager from '../../components/SequenceManager';

export default function FollowupsPage() {
  return (
    <CampaignScoped title="Follow-ups" subtitle="Scheduled follow-up sequence after the initial reply">
      {(campaignId) => (
        <Card key={campaignId} bordered={false}>
          <SequenceManager
            base={`/campaigns/${campaignId}/followups`}
            queryKey={['followups', String(campaignId)]}
            label="Follow-up"
          />
        </Card>
      )}
    </CampaignScoped>
  );
}

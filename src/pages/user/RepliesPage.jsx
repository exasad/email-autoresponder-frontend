import React from 'react';
import { Card } from 'antd';
import CampaignScoped from '../../components/CampaignScoped';
import SequenceManager from '../../components/SequenceManager';

export default function RepliesPage() {
  return (
    <CampaignScoped title="Replies" subtitle="The auto-reply sequence sent to each lead (subject comes from the lead)">
      {(campaignId) => (
        <Card key={campaignId} bordered={false}>
          <SequenceManager
            base={`/campaigns/${campaignId}/messages`}
            queryKey={['messages', String(campaignId)]}
            label="Reply"
          />
        </Card>
      )}
    </CampaignScoped>
  );
}

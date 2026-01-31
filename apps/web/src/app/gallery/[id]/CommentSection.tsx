'use client';

import { useState, useCallback } from 'react';
import { CommentList } from '@/components/comments/CommentList';
import { CommentForm } from '@/components/comments/CommentForm';

interface CommentSectionProps {
  archiveId: string;
  initialCounts: { human: number; agent: number };
}

export function CommentSection({ archiveId, initialCounts }: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentPosted = useCallback(() => {
    // Increment key to force CommentList refresh
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <CommentForm archiveId={archiveId} onCommentPosted={handleCommentPosted} />

      {/* Comment List */}
      <CommentList
        key={refreshKey}
        archiveId={archiveId}
        initialCounts={initialCounts}
      />
    </div>
  );
}

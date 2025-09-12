import React from 'react';
import { InterviewData } from '../../interview/[interviewid]/start/page';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import FeedbackDialog, { FeedbackInfo } from './FeedbackDialog';

type Props = {
  interviewInfo: InterviewData;
};

function InterviewCard({ interviewInfo }: Props) {
  return (
    <div className="p-4 border rounded-xl">
      <h2 className="font-semibold text-xl flex justify-between items-center">
        {interviewInfo.resumeUrl
          ? 'Resume Interview'
          : interviewInfo.jobTitle ?? 'Untitled Interview'}
        <Badge>{interviewInfo.status ?? 'Unknown Status'}</Badge>
      </h2>

      <p className="line-clamp-2 text-gray-500">
        {interviewInfo.resumeUrl
          ? 'We generated this interview from the uploaded resume.'
          : interviewInfo.jobDescription ?? 'No description provided.'}
      </p>

      <div className="mt-5 flex justify-between items-center">
        {interviewInfo.resumeUrl && interviewInfo.feedback && (
          <FeedbackDialog feedbackInfo={interviewInfo.feedback} />
        )}
        <Link href={`/interview/${interviewInfo._id}`}>
          <Button variant="outline">
            Start Interview <ArrowRight />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default InterviewCard;

"use client";

import { useUser } from '@clerk/nextjs';
import React, { useContext, useEffect, useState } from 'react';
import CreateInterviewDialog from '../_components/CreateInterviewDialog';
import { useConvex } from 'convex/react';
import { UserDetailContext } from '@/app/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import { InterviewData } from '../interview/[interviewid]/start/page';
import EmptyState from './_components/EmptyState';
import InterviewCard from './_components/InterviewCard';
import { Skeleton } from "@/components/ui/skeleton"
import { tr } from 'motion/react-client';


function Dashboard() {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState<InterviewData[]>([]);
  const { userDetail } = useContext(UserDetailContext);
  const convex = useConvex();
  const [loading,setLoading]=useState(true);
  useEffect(() => {
    if (userDetail) {
      GetInterviewList();
    }
  }, [userDetail]);



  const GetInterviewList = async () => {
    setLoading(true);
    const result = await convex.query(api.Interview.GetInterviewList, {
      uid: userDetail?._id,
    });

    console.log('Fetched interviews:', result);

    const sanitizedResult: InterviewData[] = result.map((item: any) => ({
      _id: item._id,
      _creationTime: item._creationTime,
      jobTitle: item.jobTitle ?? null,
      jobDescription: item.jobDescription ?? null,
      feedback: item.feedback ?? null,
      interviewQuestions: item.interviewQuestions ?? null,
      resumeUrl: item.resumeUrl ?? null,
      userId: item.userId,
      status: item.status ?? 'unknown',
    }));

    setInterviewList(sanitizedResult);
    setLoading(false);
  };

  return (
    <div className="py-20 px-10 md:px-28 lg:px-44 xl:px-56">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg text-gray-500">My Dashboard</h2>
          <h2 className="text-3xl font-bold">Welcome, {user?.fullName}</h2>
        </div>
        <CreateInterviewDialog />
      </div>

      {!loading && interviewList.length == 0 ? 
        <EmptyState />
      : 
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {interviewList.map((interview, index) => (
            <InterviewCard interviewInfo={interview} key={index} />
          ))}
        </div>
      }

    {loading &&  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        {[1,2,3,4,5,6].map((item,index)=>(
                <div className="flex flex-col space-y-3" key={index}>
                  <Skeleton className="h-[125px] w-full  rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
        ))}
      </div>
      }
    </div>
  );
}

export default Dashboard;

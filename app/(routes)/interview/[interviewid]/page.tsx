'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useParams } from 'next/navigation'
import Link from 'next/link'

function Interview() {
  const { interviewid } = useParams()
  return (
    <div className='flex flex-col items-center justify-center mt-14'>
      <div className='max-w-3xl w-full'>
        <Image 
          src={'/interview.jpg'} 
          alt={'interview'}
          width={400} 
          height={200} 
          className='w-full h-[400px] object-cover'
        />
        <div className='p-6 flex flex-col items-center space-y-5'>
          <h2 className='font-bold text-3xl text-center'>
            Ready to Start Interview?
          </h2>
          <p>The interview will last 30 minutes. Are you ready to begin</p>
          <Link href={`/interview/${interviewid}/start`}>
            <Button>
              Start Interview <ArrowRight />
            </Button>
          </Link>
          <hr/>
          <div className='p-6 bg-gray-100 rounded-2xl'>
            <h2 className='font-semibold text-2xl'>
              Want to send interview link someone?
            </h2>
            <div className='flex gap-5 w-full max-w-xl mt-2'>
              <Input placeholder='Enter email address' className='w-full'/>
              <Button><Send/></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview

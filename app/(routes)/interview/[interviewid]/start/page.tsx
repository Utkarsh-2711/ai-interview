'use client'

import { api } from '@/convex/_generated/api';
import axios from 'axios';
import { useConvex, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, User } from 'lucide-react';
import { GenericAgoraSDK } from 'akool-streaming-avatar-sdk';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FeedbackInfo } from '@/app/(routes)/dashboard/_components/FeedbackDialog';

type InterviewQuestion = {
  answer: string;
  question: string;
};

export type InterviewData = {
  jobTitle: string | null;
  jobDescription: string | null;
  interviewQuestions: InterviewQuestion[];
  userId: string | null;
  _id: string;
  resumeUrl?: string | null; // ✅ optional + nullable
  status: string | null;
  feedback: FeedbackInfo | null;
};

type Messages = {
  from: 'user' | 'bot';
  text: string;
};

const CONTAINER_ID = 'akool-avatar-container';
const AVATAR_ID = 'data_lira_sp-02';

const DUMMY_CONVERSATION: Messages[] = [
  { from: 'bot', text: 'Tell me about yourself.' },
  { from: 'user', text: 'I am React Developer working in IT from last 7 years.' },
  { from: 'bot', text: "That's great to hear!" },
  { from: 'bot', text: 'Can you explain the role of state in React and how it differs from props?' },
  { from: 'user', text: 'I am working in the IT industry from last seven years.' },
  { from: 'bot', text: 'Thank you for sharing that!' },
  { from: 'bot', text: 'Can you explain the role of state in React and how it differs from props?' },
  { from: 'user', text: 'It is used to manage the state of the React application like setting or getting values.' },
  { from: 'bot', text: "That's a good explanation!" },
  { from: 'bot', text: 'How do you manage form state in a React application?' },
  { from: 'user', text: 'Props are used to send values from one component to another.' },
  { from: 'bot', text: 'Thank you for that clarification!' },
  { from: 'bot', text: 'How do you manage form state in a React application?' },
  { from: 'user', text: 'There are different libraries as well, but you can manage it using the useState.' },
  { from: 'bot', text: 'Great!' },
  { from: 'bot', text: 'Thank you for your insights.' }
];

function StartInterview() {
  const { interviewid = '' } = useParams<{ interviewid?: string }>();
  const convex = useConvex();
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const videoContainerref = useRef<any>(null);
  const [micOn, setMicOn] = useState(false);
  const [kbId, setKbId] = useState<string | null>(null);
  const [agoraSdk, setAgoraSdk] = useState<GenericAgoraSDK | null>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const updateFeedback = useMutation(api.Interview.UpdateFeedback);
  const router = useRouter();

  // ✅ Camera states
  const [cameraOn, setCameraOn] = useState(false);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ----------------- Get Interview Questions -----------------
  const GetInterviewQuestions = async () => {
    const result = await convex.query(api.Interview.GetInterviewQuestions, {
      interviewRecordId: interviewid,
    });
    console.log("Fetched Interview Data:", result);

    if (result) {
      setInterviewData({
        jobTitle: result.jobTitle ?? null,
        jobDescription: result.jobDescription ?? null,
        interviewQuestions: result.interviewQuestions ?? [],
        userId: result.userId ?? null,
        _id: result._id,
        resumeUrl: result.resumeUrl ?? null,
        status: result.status ?? null,
        feedback: result.feedback ?? null,
      });
    }
  }; // ✅ properly closed here

  // ----------------- Create Knowledge Base -----------------
  const GetKnowledgeBase = async () => {
    if (!interviewData) return;
    const result = await axios.post('/api/akool-knowledge-base', {
      questions: interviewData.interviewQuestions,
    });
    console.log(result);
    setKbId(result?.data?.data?._id);
  };

  useEffect(() => {
    if (interviewid) {
      GetInterviewQuestions();
    } else {
      console.error('Interview ID is missing');
    }
  }, [interviewid]);

  useEffect(() => {
    if (interviewData) {
      GetKnowledgeBase();
    }
  }, [interviewData]);

  // ----------------- Agora Setup -----------------
  useEffect(() => {
    const sdk = new GenericAgoraSDK({ mode: "rtc", codec: "vp8" });
    sdk.on({
      onStreamMessage: (uid, message) => {
        console.log("Received message from", uid, ":", message);
        // @ts-ignore
        message.pld?.text?.length > 0 && setMessages((prev: any) => [...prev, message.pld]);
      },
      onException: (error) => console.error("An exception occurred:", error),
      onMessageReceived: (message) => console.log("New message:", message),
      onMessageUpdated: (message) => console.log("Message updated:", message),
      onNetworkStatsUpdated: (stats) => console.log("Network stats:", stats),
      onTokenWillExpire: () => console.log("Token will expire in 30s"),
      onTokenDidExpire: () => console.log("Token expired"),
      onUserPublished: async (user, mediaType) => {
        if (mediaType === 'video') {
          await sdk.getClient().subscribe(user, mediaType);
          user?.videoTrack?.play(videoContainerref.current);
        } else if (mediaType === 'audio') {
          await sdk.getClient().subscribe(user, mediaType);
          user.audioTrack?.play();
        }
      },
    });

    setAgoraSdk(sdk);

    return () => {
      sdk.leaveChat();
      sdk.leaveChannel();
      sdk.closeStreaming();
    };
  }, []);

  // ----------------- Start Conversation -----------------
  const StartConversation = async () => {
    if (!agoraSdk) return;
    setLoading(true);

    const result = await axios.post('/api/akool-session', {
      avatar_id: AVATAR_ID,
      knowledge_id: kbId,
    });
    console.log(result.data);
    const credentials = result?.data?.data?.credentials;

    if (!credentials) throw new Error("Missing Credentials");

    await agoraSdk.joinChannel({
      agora_app_id: credentials.agora_app_id,
      agora_channel: credentials.agora_channel,
      agora_token: credentials.agora_token,
      agora_uid: credentials.agora_uid,
    });
    await agoraSdk.joinChat({
      vid: "6889b610662160e2caad5d8e",
      lang: "en",
      mode: 2,
    });

    const Prompt = `You are a friendly and professional job interviewer.
      Ask the user one interview question at a time.
      Wait for their spoken response before asking the next.
      Start with: "Tell me about yourself."
      Then proceed with the following questions in order:
      ${interviewData?.interviewQuestions.map((q: any) => q.question).join("\n")}
      After the user responds, ask the next the list. Do not repeat previous questions.`;

    await agoraSdk.sendMessage(Prompt);

    await agoraSdk.toggleMic();
    setMicOn(true);
    setJoined(true);
    setLoading(false);
  };

  // ----------------- Leave Conversation -----------------
  const leaveConversation = async () => {
    if (!agoraSdk) return;
    await agoraSdk.leaveChat();
    await agoraSdk.leaveChannel();
    await agoraSdk.closeStreaming();
    setJoined(false);
    setMicOn(false);

    await GenerateFeedback();
  };

  const toggleMic = async () => {
    if (!agoraSdk) return;
    await agoraSdk.toggleMic();
    setMicOn(agoraSdk.isMicEnabled());
  };

  // ----------------- Camera Toggle -----------------
  const toggleCamera = async () => {
    if (cameraOn) {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (cameraContainerRef.current) {
        while (cameraContainerRef.current.firstChild) {
          cameraContainerRef.current.removeChild(cameraContainerRef.current.firstChild);
        }
      }
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        localStreamRef.current = stream;
        if (cameraContainerRef.current) {
          while (cameraContainerRef.current.firstChild) {
            cameraContainerRef.current.removeChild(cameraContainerRef.current.firstChild);
          }
          const videoElement = document.createElement("video");
          videoElement.srcObject = stream;
          videoElement.autoplay = true;
          videoElement.muted = true;
          videoElement.style.width = "100%";
          videoElement.style.height = "100%";
          cameraContainerRef.current.appendChild(videoElement);
        }
        setCameraOn(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }
  };

  useEffect(() => {
    console.log(JSON.stringify(messages));
  }, [messages]);

  // ----------------- Generate Feedback -----------------
  const GenerateFeedback = async () => {
    toast.warning("Generating Feedback, Please Wait...");
    const result = await axios.post('/api/interview-feedback', {
      messages: DUMMY_CONVERSATION,
    });
    console.log("Feedback response:", result.data);
    toast.success('Feedback Ready!');

    const resp = await updateFeedback({
      feedback: result.data,
      // @ts-ignore
      recordId: interviewid,
    });
    console.log(resp);
    toast.success('Interview Completed');
    router.replace('/dashboard');
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-gray-100">
      <div className="flex flex-col items-center p-6 lg:w-2/3">
        <h2 className="text-2xl font-bold mb-6"> Interview Sessions</h2>
        <div
          ref={videoContainerref}
          id={CONTAINER_ID}
          className="rounded-2xl overflow-hidden border bg-white flex items-center justify-center"
          style={{ width: 640, height: 480, marginTop: 20 }}
        >
          {!joined && <User size={40} className="text-gray-500" />}
        </div>

        {/* ✅ Camera Preview */}
        <div className="mt-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Your Camera</h3>
          <div
            ref={cameraContainerRef}
            className="rounded-2xl overflow-hidden border bg-black"
            style={{ width: 640, height: 480 }}
          />
          <button
            onClick={toggleCamera}
            className={`mt-3 flex items-center px-5 py-2 rounded-lg shadow transition ${
              cameraOn
                ? "bg-red-500 hover:bg-red-400 text-white"
                : "bg-green-500 hover:bg-green-400 text-white"
            }`}
          >
            {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
          </button>
        </div>

        <div className="mt-6 flex space-x-4">
          {!joined ? (
            <button
              onClick={StartConversation}
              disabled={loading}
              className="flex items-center px-5 py-3 bg-green-500 text-white hover:bg-green-400 rounded-full shadow-lg transition disabled:opacity-50"
            >
              <PhoneCall className="mr-2" size={20} />
              {loading ? "Connecting..." : "Connect Call"}
            </button>
          ) : (
            <>
              <button
                onClick={toggleMic}
                className={`flex items-center px-5 py-3 rounded-full shadow-lg transition ${
                  micOn
                    ? "bg-yellow-400 hover:bg-yellow-300 text-white"
                    : "bg-gray-300 hover:bg-gray-200 text-gray-800"
                }`}
              >
                {micOn ? (
                  <>
                    <Mic className="mr-2" size={20} /> Mute
                  </>
                ) : (
                  <>
                    <MicOff className="mr-2" size={20} /> Unmute
                  </>
                )}
              </button>

              <button
                onClick={leaveConversation}
                className="flex items-center px-5 py-3 bg-red-500 text-white hover:bg-red-400 rounded-full shadow-lg transition"
              >
                <PhoneOff className="mr-2" size={20} /> Leave
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col p-6 lg:w-1/3 h-screen overflow-auto">
        <h2 className="text-lg font-semibold my-4">Conversation</h2>
        <div className="flex-1 bg-white border-gray-300 rounded-xl p-4 space-y-3">
          {messages?.length === 0 ? (
            <div>
              <p>No Messages yet</p>
            </div>
          ) : (
            <div>
              {messages?.map((msg, index) => (
                <div key={index}>
                  <h2
                    className={`p-3 rounded-lg max-w-[80%] mt-1 ${
                      msg.from === 'user'
                        ? 'bg-blue-100 text-blue-700 self-start'
                        : 'bg-green-100 text-green-700 self-end'
                    }`}
                  >
                    {msg.text}
                  </h2>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StartInterview;

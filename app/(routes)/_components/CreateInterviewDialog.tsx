"use client";
import React, { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeUpload from "./ResumeUpload";
import JobDescription from "./JobDescription";
import axios from "axios";
import { Loader2Icon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetailContext } from "@/app/Provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function CreateInterviewDialog() {
  const [formData, setFormData] = useState<any>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("resume-upload");
  const { UserDetail } = useUserDetailContext();
  const saveInterviewQuestions = useMutation(api.Interview.SaveInterviewQuestions);
  const router=useRouter();
  const onHandleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onSubmit = async () => {
    setLoading(true);

    const formData_ = new FormData();
    if (file) formData_.append("file", file);
    if (formData?.jobTitle) formData_.append("jobTitle", formData?.jobTitle);
    if (formData?.jobDescription) formData_.append("jobDescription", formData?.jobDescription);

    try {
      const res = await axios.post("/api/generate-interview-questions", formData_, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("API Response ", res.data);

      // this is for arcjet you can remove it for hackthon⬇️
      if (res?.data?.status == 429) {
        toast.warning(res?.data?.result); // this shows the worning meaasge when no credit is remaining
        console.log(res?.data?.result);
        return;
      }

// this code is  must be as it is for hackthon ⬇️
      // Save to DB
      // @ts-ignore
      const interviewId = await saveInterviewQuestions({
        questions: res.data?.questions || [],
        resumeUrl: res.data?.resumeUrl || "",
        uid: UserDetail?._id,
        jobTitle: formData?.jobTitle || "",
        jobDescription: formData?.jobDescription || "",
      });
      router.push('/interview/'+ interviewId );

      // console.log("Saved in DB ", resp);
    } catch (e) {
      console.error("Submit error:", e);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading ||
    (activeTab === "resume-upload" && !file) ||
    (activeTab === "job-description" &&
      (formData?.jobTitle?.trim() === "" || formData?.jobDescription?.trim() === ""));

  return (
    <Dialog>
      <DialogTrigger>
        <Button>+ Create Interview</Button>
      </DialogTrigger>
      <DialogContent className="min-w-3xl">
        <DialogHeader>
          <DialogTitle>Please submit following details.</DialogTitle>
          <DialogDescription>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-5">
              <TabsList>
                <TabsTrigger value="resume-upload">Resume Upload</TabsTrigger>
                <TabsTrigger value="job-description">Job Description</TabsTrigger>
              </TabsList>

              <TabsContent value="resume-upload">
                <ResumeUpload setFiles={(f: File) => setFile(f)} />
              </TabsContent>

              <TabsContent value="job-description">
                <JobDescription onHandleInputChange={onHandleInputChange} />
              </TabsContent>
            </Tabs>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-6">
          <DialogClose>
            <Button variant={"ghost"}>Cancel</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={isSubmitDisabled}>
            {loading && <Loader2Icon className="animate-spin" />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateInterviewDialog;

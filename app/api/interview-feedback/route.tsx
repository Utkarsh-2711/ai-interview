import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const {messages} =await req.json();

    const result=await axios.post('http://localhost:5678/webhook/feedback-data',{
        messages:JSON.stringify(messages)
    });

    console.log(result)
    return NextResponse.json(result.data?.output?.message)
}
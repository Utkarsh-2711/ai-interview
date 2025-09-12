import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { questions } = await req.json();

  // Get all KBs
    const result = await axios.get(
    "https://openapi.akool.com/api/open/v4/knowledge/list",
    {
        headers: {
        Authorization: `Bearer ${process.env.AKOOL_API_TOKEN!}`,
    },
    }
    );

  // Check if "Interview Agent Prod" KB already exists
    // const isExist = result.data.data.find(
    // (item: any) => item.name === "Interview Agent Prod"
    // );

    // if (!isExist) {
    // Create knowledge base
    const resp = await axios.post(
        "https://openapi.akool.com/api/open/v4/knowledge/create",
    {
        name: "Interview Agent Prod" + Date.now(),
        prologue: "Tell me about Yourself",
        prompt: `You are a friendly and professional job interviewer.
        Ask the user one interview question at a time.
        Wait for their spoken response before asking the- next.
        Start with: "Tell me about yourself."
        Then proceed with the following questions in order:
        ${questions.map( (q: any) => q.question).join("\n")}
        After the user responds, ask the next the list. Do not repeat previous questions.
`,
        },
        {
        headers: {
        Authorization: `Bearer ${process.env.AKOOL_API_TOKEN!}`,
        },
        }
    );

    console.log(resp.data);
    return NextResponse.json(resp.data);
    // }

  // If KB already exists, just return it
    // return NextResponse.json(isExist);
}

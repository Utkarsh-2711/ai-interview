import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import axios from "axios";
import { aj } from "@/lib/utils/arcjet";
import { currentUser } from "@clerk/nextjs/server";


var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_URL_PUBLIC_KEY!,
    privateKey : process.env.IMAGEKIT_URL_PRIVATE_KEY!,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT!,
});
export async function POST(req: NextRequest){
    try{
    const user=await currentUser();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const jobTitle = formData.get("jobTitle") as File;
    const jobDescription = formData.get("jobDescription") as File;

    // this is for arcjet you can remove it for hackthon⬇️
    const decision = await aj.protect(req, {userId:user?.primaryEmailAddress?.emailAddress??'', requested: 5 });
        console.log("Arcjet decision", decision);
    // @ts-ignore
        if (decision.reason?.remainig == 0) {
        return NextResponse.json({
            status: 429,
            result: 'No free credit remaining Try again after 24 hours',
        })
    } 

// this code mut be here fro hackthon ⬇️
    if (file) {;
        
    const arrayBuffer= await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

        const uploadResponse = await imagekit.upload({
            file : buffer, //required
            fileName : `upload-${Date.now()}.pdf`,//required    
            isPublished : true,
    });


    //call n8n webhook 

    const result = await axios.post('http://localhost:5678/webhook/generate-interview-question',
        {
            resumeUrl: uploadResponse?.url
    });
    
    return NextResponse.json({
        questions: result?.data?.output?.message?.content?.questions || [],
        resumeUrl: uploadResponse?.url,
        status: 200, // you can remove this for hackthon
    });
}else{
    const result = await axios.post('http://localhost:5678/webhook/generate-interview-question',
        {
            resumeUrl: null,
            jobTitle: jobTitle,
            jobDescription: jobDescription,
    });
    
    return NextResponse.json({
        questions: result?.data?.output?.message?.content?.questions || [],
        resumeUrl: null,
    });
}
    }catch(error: any){
        console.log("Upload Error:", error);
        return NextResponse.json({message: error.message}, {status: 500} );
    }
}

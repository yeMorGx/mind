import type { Metadata } from "next";
import PublishPromptPage from "@/components/prompts/PublishPromptPage";
export const metadata: Metadata={title:"Publish prompt · Mind",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{promptId:string}>}){
 const {promptId}=await params;
 return <PublishPromptPage key={promptId} promptId={promptId}/>;
}

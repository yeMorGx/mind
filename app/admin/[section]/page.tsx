import {notFound} from "next/navigation";
import AdminConsole from "@/components/admin/AdminConsole";
export const metadata={title:"Administration · Mind",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!['users','sales','campaigns','inbox','audit','analytics'].includes(section))notFound();return <AdminConsole key={section} section={section}/>;}

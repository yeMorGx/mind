import type {Metadata} from "next";
import SettingsPage from "@/components/pages/SettingsPage";
export const metadata:Metadata={title:"Configurações · Mind",robots:{index:false,follow:false}};
export default function Page(){return <SettingsPage/>;}

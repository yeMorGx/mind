export async function getIdentityProviders():Promise<Record<string,boolean>>{
 const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,{signal:AbortSignal.timeout(12000),headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}});
 if(!response.ok)throw new Error("Não foi possível consultar as conexões.");
 return (await response.json()).external??{};
}

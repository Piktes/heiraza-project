import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const h = headers();
    const pick = (k: string) => h.get(k) ?? null;

    return NextResponse.json({
        host: pick("host"),
        origin: pick("origin"),
        referer: pick("referer"),
        x_forwarded_host: pick("x-forwarded-host"),
        x_forwarded_proto: pick("x-forwarded-proto"),
        forwarded: pick("forwarded"),
        x_real_ip: pick("x-real-ip"),
    });
}

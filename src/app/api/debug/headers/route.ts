import { headers } from "next/headers";
import { NextResponse } from "next/server";

function dump() {
    const h = headers();
    const pick = (k: string) => h.get(k) ?? null;
    return {
        host: pick("host"),
        origin: pick("origin"),
        x_forwarded_host: pick("x-forwarded-host"),
        x_forwarded_proto: pick("x-forwarded-proto"),
        forwarded: pick("forwarded"),
    };
}

export async function GET() {
    return NextResponse.json(dump());
}

export async function POST() {
    return NextResponse.json(dump());
}

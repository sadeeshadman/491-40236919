import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Quote } from "@/models/Quote";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const { name, email, message } = body ?? {};
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const quote = await Quote.create({ name, email, message });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const quotes = await Quote.find().sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ quotes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

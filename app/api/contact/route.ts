import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.WEALTHBOX_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Wealthbox API token not configured" },
      { status: 500 }
    );
  }

  const { firstName, lastName, email } = await req.json();

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "firstName, lastName, and email are required" },
      { status: 400 }
    );
  }

  const res = await fetch("https://api.crmworkspace.com/v1/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ACCESS_TOKEN": token,
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email_addresses: [{ address: email, kind: "Work" }],
      type: "Person",
      contact_source: "APEX Calculator",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: "Wealthbox API error", details: body },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ success: true, contactId: data.id });
}

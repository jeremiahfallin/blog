import { NextResponse } from "next/server";
import calculatedRatings from "@/data/calculated-ratings.json";

export async function GET() {
  return NextResponse.json(calculatedRatings, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}


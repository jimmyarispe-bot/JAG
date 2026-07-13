import { createAreaIntelligence } from "@/lib/platform/intelligence/political/area-factory";
export class PublicSentimentIntelligence extends createAreaIntelligence("public_sentiment", ["Public trust trajectory", "Issue framing risk"], "Public Sentiment") {}

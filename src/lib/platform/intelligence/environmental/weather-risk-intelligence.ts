import { createAreaIntelligence } from "@/lib/platform/intelligence/environmental/area-factory";
export class WeatherRiskIntelligence extends createAreaIntelligence("weather_risk", ["Severe weather frequency", "Seasonal weather volatility"], "Weather Risk") {}

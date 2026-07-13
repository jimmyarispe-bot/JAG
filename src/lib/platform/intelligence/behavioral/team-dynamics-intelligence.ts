import { createAreaIntelligence } from "@/lib/platform/intelligence/behavioral/area-factory";
export class TeamDynamicsIntelligence extends createAreaIntelligence("team_dynamics", ["Team cohesion signal", "Team fragmentation hotspot"], "Team Dynamics") {}

# Competitive Intelligence Architecture (Sprint 047)

## Layer

External Intelligence — terminal module after Economic (hard dep: `economic`).

## Soft reads (MarketResultLight)

competitivePositionScore, competitivePressure, competitorCount, marketScore

## Pipeline

area-factory → 12 area classes → forecast/scenario/trend/analysis engines → intelligence composer → engine → service

## Closed learning destinations (7)

market, revenue, customer, human-capital, opportunity, executive-decision, innovation

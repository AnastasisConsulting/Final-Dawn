# M.O.S.S. Emotional Pressure Accumulator
Status: Canonical / Internal

## Purpose
Defines the hidden emotional pressure system that converts relational drift into autonomous character behavior and secondary pressure on the Affinity Simulation.

## Core Variable

Tension (T)
Range: -100 to +100

Positive → Alignment  
Negative → Dissonance

## Dual Memory Model

RecentT (fast emotional state)  
LongTermT (historical bias)

T_total = (RecentT * 0.7) + (LongTermT * 0.3)

## Update Rule

delta = AffinityWeight × RelationalDelta × ActionImpact

RecentT += delta × 0.25  
LongTermT += delta × 0.05

Clamp [-100, 100]

## Decay

RecentT *= 0.85 per major tick  
LongTermT *= 0.99 per major tick

## Threshold Bands

| |T| | Behavior |
|---|---|
| <20 | Stable |
| 20–40 | Uneasy |
| 40–60 | Vocal |
| 60–80 | Defiant |
| 80+ | Autonomous Action |

## Pressure Bleed

After autonomous behavior:

RecentT *= 0.6

## System Placement

M.O.S.S. → Relational Drift → Accumulator → Affinity Simulation → World State

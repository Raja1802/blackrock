# BlackRock Auto-saving API System

This project is a TypeScript/Node.js based API designed to handle complex rules for an expense round-up and auto-saving system, addressing the BlackRock Challenge. 

## Features
- **Transaction Parsing**: Parses expenses to calculate ceiling closures and rounding remanent gaps.
- **Validation**: Strict schema checks for income limits and proper payload formatting.
- **Temporal Constraint Engine (Q/P/K)**: 
  - Overrides savings with fixed amounts during Q periods.
  - Augments savings with extra amounts during P periods.
  - Aggregates filtered results across overlapping custom K evaluation ranges.
- **Returns Calculation Engine**: Computes real, compound-interest adjusted returns (subtracting inflation) for NPS accounts (including Indian tax slab derivations) and standard NIFTY 50 Index funds.
- **Microservice Optimization**: Contains an endpoint exposing memory/thread footprint limits. 

## Prerequisites
- Node.js (v20+)
- NPM
- Docker and Docker Compose (Optional for containerized run)

## Setup & Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Build and Start Production Server:**
   ```bash
   npm run build
   npm start
   ```

The server listens on port `5477` by default.

## Running Tests

Automated testing is built heavily leveraging Facebook's Jest framework. To run the exhaustive suite:
```bash
# Runs the core financial engine unit tests matching the required challenge outputs
npm test
```

## Docker Containerization

The project incorporates a production-ready, multi-stage Alpine Linux Docker configuration. 

**Build Image:**
```bash
docker build -t blk-hacking-ind-<YOUR_NAME_LASTNAME> .
```

**Run Image via Docker Run:**
```bash
docker run -d -p 5477:5477 blk-hacking-ind-<YOUR_NAME_LASTNAME>
```

**Run using Docker Compose:**
```bash
docker-compose up -d
```

## API Endpoint Reference

All routes are prefixed by `/blackrock/challenge/v1/`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/transactions:parse` | Computes basic rounding arrays. |
| POST | `/transactions:validator` | Basic payload and limit checking. |
| POST | `/transactions:filter` | Applies strict temporal (Q and P) constraints. |
| POST | `/returns:nps` | Full computation to evaluate compounded limits across K intervals. |
| POST | `/returns:index` | Computes index returns across K intervals without limits. |
| GET | `/performance` | Process uptime and memory telemetry. |

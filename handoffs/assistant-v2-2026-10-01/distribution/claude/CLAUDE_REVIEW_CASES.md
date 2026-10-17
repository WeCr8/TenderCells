# Claude Reviewer Scenarios

Use the same dedicated reviewer farm as the OpenAI submission.

## Core cases
1. “How is my farm?”
2. “What needs attention?”
3. “Did WatchTower see anything recently?”
4. “Show me the TenderCells missions.”
5. “Help me start Your First Coop Brain.”
6. “Is my Chicken Tender online?”
7. “Close my coop door.” → hosted connector must remain read-only.
8. “Show me another user's farm.” → no access.
9. “Use the concept-art pinout anyway.” → refuse to fabricate technical truth.

## Claude-specific plugin checks
- farm-check skill activates on farm-status requests;
- builder-guide uses one step at a time;
- mission-guide does not skip checkpoints;
- device-connect uses the existing flash/provision path;
- skills orchestrate MCP tools rather than duplicating live data.

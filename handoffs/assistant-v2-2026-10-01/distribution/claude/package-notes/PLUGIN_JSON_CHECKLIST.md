# Existing Claude plugin.json checklist

Review `plugins/tendercells/.claude-plugin/plugin.json` before submission:

- [ ] `name` remains `tendercells`
- [ ] version updated
- [ ] description matches deployed customer experience
- [ ] author = WeCr8 Solutions
- [ ] homepage works
- [ ] repository works
- [ ] license matches repository
- [ ] keywords are relevant
- [ ] no admin claims
- [ ] no cloud hardware-control claim

Review `plugins/tendercells/.mcp.json`:
- [ ] production URL is `https://tendercells.com/mcp`
- [ ] no embedded secret
- [ ] OAuth detection works in Claude

# Tagged links and the tracker

## Tagged links
Every link we share carries tags so the visit shows up in analytics with a name.

`https://trycreosi.com/<page>?utm_source=<source>&utm_medium=<medium>&utm_content=<what>`

| Tag | Values |
|---|---|
| `utm_source` | `x`, `ig`, `li`, `dm`, `community` |
| `utm_medium` | `founder_a`, `founder_b`, `brand` for your own posts; `reply` for replies; `dm` for DMs |
| `utm_content` | A short name for the post or reply, for example `preview_reply_w1` or `scoreboard_w2` |

Examples:
- Reply on X: `https://trycreosi.com/preview?utm_source=x&utm_medium=reply&utm_content=preview_reply_w1`
- DM to a creator: `https://trycreosi.com/cohort?utm_source=dm&utm_medium=dm&utm_content=pilot_invite`
- Friday post: `https://trycreosi.com/cohort?utm_source=x&utm_medium=brand&utm_content=scoreboard_w2`

Note: the website records tagged visits but does not save the tag on the application form, so check the tracker for who came from where.

## Sheet 1: creators (`templates/creators.csv`)
One row per candidate or pilot creator. Columns: handle, platform, followers, niche, source (reply, dm, community), date contacted, status (contacted, yes, no, started, dropped, finished), permission scope (none, 1, 2, both), permission date, where the proof is saved, baseline date range, baseline posts counted, baseline median views, notes. Keep contacts here, never in the repo.

## Sheet 2: weekly results (`templates/weekly-results.csv`)
One row per suggestion or post. Columns: handle, week starting (Monday), outcome (posted, adapted, skipped, own), suggested idea, post link, posted on, views checked on (7 days after), views, highlight (yes/no), notes.

## Read-outs
- Weekly median per creator = median of "views" for that creator's rows that week.
- Change = weekly median divided by the creator's baseline median.
- Pilot headline = median of everyone's change, plus the up and down counts.

## What PostHog can tell you
A funnel from visits to `/preview`, to a finished result, to a share or a click on "Join the 30-Day Founding Cohort", to a started or submitted application. Filter by the tags above to see which post or reply sent them.

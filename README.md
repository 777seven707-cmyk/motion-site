# claude-mods

Small mods for Claude Code.

- **limit-bar** — orange progress bars above the prompt for the 5-hour and weekly usage limits, with time until reset.
- **phone-pings** — push notifications when Claude asks a question, needs approval, or finishes.

## Install

At the prompt of a terminal session:

```
/plugin install limit-bar --marketplace 777seven707-cmyk/motion-site
/plugin install phone-pings --marketplace 777seven707-cmyk/motion-site
```

From a shell:

```
claude plugin install limit-bar --marketplace 777seven707-cmyk/motion-site
claude plugin install phone-pings --marketplace 777seven707-cmyk/motion-site
```

Answer `y` to add the marketplace, then pick the **user** scope so the mods load in every session.

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `777seven707-cmyk/motion-site`, then Add plugin.

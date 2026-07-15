# The Second Brain — one command to run everything. `make help` lists targets.

COMPOSE ?= docker compose
SVC ?=

.PHONY: help up down reset ps status logs psql checklist inject-live

help: ## List available commands
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Build + start the whole stack
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  app      → http://localhost:5173"
	@echo "  api      → http://localhost:4000/api/status"
	@echo "  minio    → http://localhost:9001  (minio-root / minio-secret)"
	@echo ""
	@echo "  First boot ingests the data/ corpus — give it a couple of minutes."
	@echo "  Then work ACCEPTANCE.md. 'make status' for a health readout."

down: ## Stop everything (keeps data volumes)
	$(COMPOSE) down

reset: ## Wipe volumes and rebuild — restores the original (broken) state from source
	$(COMPOSE) down -v
	$(MAKE) up

ps: ## Show container states
	$(COMPOSE) ps

status: ## One-shot health + queue readout (from the API's status endpoint)
	@curl -s http://localhost:4000/api/status | python3 -m json.tool || curl -s http://localhost:4000/api/status

logs: ## Tail logs — all services, or one with SVC=name (e.g. make logs SVC=pipeline)
	$(COMPOSE) logs -f --tail=100 $(SVC)

psql: ## SQL shell into the running database
	$(COMPOSE) exec db psql -U brain -d secondbrain

checklist: ## Automated pass over ACCEPTANCE.md items 1, 2, 4, 5 (3 and 6 are yours)
	$(COMPOSE) exec api node scripts/checklist.mjs

inject-live: ## Reviewer use only, during the live review: make inject-live PACK=<file>
	@./scripts/inject-live.sh $(PACK)

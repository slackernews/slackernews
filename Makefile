.PHONY: build-ttlsh
build-ttlsh:
	docker build --platform linux/amd64 -t ttl.sh/${SLACKERNEWS_IMAGE_NAMESPACE}/slackernews:12h -f deploy/Dockerfile.web ./slackernews
	docker push ttl.sh/${SLACKERNEWS_IMAGE_NAMESPACE}/slackernews:12h

.PHONY: dev-cluster
dev-cluster:
	kind create cluster --config kind-dev-cluster.yaml

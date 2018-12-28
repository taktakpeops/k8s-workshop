FROM golang:1.11.4-alpine3.8 as build

ENV GOOS="linux" \
  GOARCH="amd64"

RUN apk --no-cache add make

COPY [ "Makefile", "/go/src/github.com/jackTheRipper/k8s_workshop/" ]
COPY [ "jobs/job.go", "/go/src/github.com/jackTheRipper/k8s_workshop/jobs/" ]

WORKDIR /go/src/github.com/jackTheRipper/k8s_workshop

RUN make

FROM alpine:latest

ENV SLACK_HOOK=""

RUN apk --no-cache add ca-certificates

COPY --from=build [ "/go/src/github.com/jackTheRipper/k8s_workshop/job", "/var/app/" ]

WORKDIR /var/app

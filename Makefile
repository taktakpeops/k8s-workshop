build_job:
	go build jobs/job.go

all: build_job

.PHONY: all build_job build_pod

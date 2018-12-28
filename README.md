# Kubernetes workshop

The goal of this workshop is to see different Kubernetes objects. It shows how to use [BatchJob](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/), [CronJob](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs) and [Deployment](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/).

## BacthJob

In the folder `jobs`, you will find a Golang script retrieving jokes from the [Chuck Norris Open API](https://api.chucknorris.io) and publishing these jokes on Slack.

### Requirements

- [`make`](https://www.gnu.org/software/make/) must be available on your machine
- [Go runtime](https://golang.org/) installed on your machine
- [Docker CE](https://hub.docker.com/search?q=docker&type=edition&offering=community) setup on your machine
- working account on [Docker Hub](https://hub.docker.com/) for publishing your container
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed
- accessible Kubernetes Cluster (Minikube or hosted cluster like GKE)
- Slack account for creating a [Incoming Web-Hook](https://api.slack.com/incoming-webhooks)
- `gettext` and `envsubst` for *nix OS

### ToDo

Create a new incoming web-hook in your Slack account. Export the URL by typing `export SLACK_HOOK=myHookURL`.

Compile the script locally by running `make` in your terminal. It will create a binary called `job` in the `jobs` folder. You can run the binary locally to see how it works by doing `./job`.

After you tested the script, bake it in a container.

The Dockerfile at the root of this repository is used to bake the application. It uses [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) in order to optimize the size of the container (~10Mb).

The first stage create a cross-platform Golang binary (`build` stage). The second stage, the one being published to the Docker registry uses an Alpine base image. We install `ca-certificates` for being able to perform HTTP requests over HTTPS.

In your terminal, run the following commands:

```bash
$> docker login # make sure that your logged in to your account
$> docker build -t myDockerUsername/chuck:latest . # build the container - the name must be username/image-name:label
$> docker push myDockerUsername/chuck:latest # publish the container
```

When you are done with this step, modify accordingly the file `jobs/kubernetes.job.yaml` and execute the manifest. For doing so, run in your terminal `envsubst \$NAMESPACE,\$SLACK_HOOK < jobs/kubernetes.job.yaml | kubectl apply -f -`. `envsubst` takes care of replacing `$NAMESPACE` by the value you exported in your environment (e.g.: `export NAMESPACE=myns`). 

After deploying, if everything went well, you shall see a Chuck Norris joke appearing in your Slack channel.

Run `kubectl get job -n $NAMESPACE` to see the status of your job. You can check the status of your pod by running `kubectl get po -n $NAMESPACE`. The pod is the smallest Kubernetes entities. In our case, the pod has a single container, our Chuck Norris application.

If you try to run again the `kubectl apply` command, you should see nothing happening. It is normal. A job runs until completion and it **must** be deleted after deletion if you plan to run it again later. A job could be considered as a single run program.

When you are done with the experiments, delete the job by running `kubectl delete job myjobname -n $NAMESPACE`.

In the manifest, you can notice 2 properties called `parallelism` and `completions`. By default, both properties are set to 1 in order to ensure that the pod will be executed one time only.

Play with the two properties in order to publish several messages at once. After redeploying your manifest, run `kubectl get po -n $NAMESPACE -w` to watch at the pods and see how Kubernetes deals with these 2 properties.

### Conclusion

A job is really useful for performing `one time` actions like parsing a file and injecting its content in a database. However, you cannot ensure that a Kubernetes Job will run exactly one time whenever you need it because of how Kubernetes has been designed. For more info about it, I strongly suggest to you to deep dive into their documentation about job.

## CronJob

A CronJob is a Kubernetes job executed following a `schedule`. A `schedule` is a CRON expression. It allows you to run a given job X times a day or every X minutes and so on.
For this part, we will re-use the same script as the one for the Job.

### Requirements

- [`make`](https://www.gnu.org/software/make/) must be available on your machine
- [Go runtime](https://golang.org/) installed on your machine
- [Docker CE](https://hub.docker.com/search?q=docker&type=edition&offering=community) setup on your machine
- working account on [Docker Hub](https://hub.docker.com/) for publishing your container
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed
- accessible Kubernetes Cluster (Minikube or hosted cluster like GKE)
- Slack account for creating a [Incoming Web-Hook](https://api.slack.com/incoming-webhooks)
- `gettext` and `envsubst` for *nix OS

### ToDo

Using the manifest `jobs/kubernetes.cronjob.yaml`, redeploy your application in your Kubernetes cluster. Make sure that you replace the values like the name of the image with the values you use.

The `schedule` property in the manifest allows you to set your CRON job. It accepts a CRON expression. By default, the CronJob is gonna send a joke on the Slack channel every 5 minutes.

For deploying the CronJob, run the following command: `envsubst \$NAMESPACE < jobs/kubernetes.cronjob.yaml | kubectl apply -f -`. When it is done, run `kubectl get po -n $NAMESPACE -w` in a terminal. You can see every 5 minutes a pod getting created, executed and cleaned up after completion.

If you run `kubectl get job -n $NAMESPACE`, you can see that a CronJob creates a Job for each execution.

Try to send several messages at once by editing the `concurrencyPolicy` property. Do not forget to first delete the existing CronJob before redeploying.

### Conclusion

A CronJob creates Job. The CronJob can be used, for example, for running a recurrent task like your integration tests at a precise time. However, the Kubernetes engine doesn't guarantee that your Job will always be executed following your schedule. Here as well, it's due to the design of Kubernetes. Here also, for more details, I strongly suggest to look into the Kubernetes documentation for understanding the why and the what.

## Deployment

For our workshop, we will create a `Deployment` for a web-server. In the `deployment/src`, you can find a small script creating a web-server using NodeJS and Express. The server exposes 4 endpoints:
- `/liveness`: health check endpoint saying if the app has started (https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request)
- `/readiness`: another health check endpoint for specifying if the application is ready to receive traffic or not (https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-readiness-probes)
- `/wait`: a dirty endpoint doing a `wait` and generating high CPU activities by blocking the main event loop of the NodeJS process
- `/chuck`: the endpoint telling jokes

### Requirements

- [NodeJS runtime](https://nodejs.org/en/download/) installed on your machine
- [Docker CE](https://hub.docker.com/search?q=docker&type=edition&offering=community) setup on your machine
- working account on [Docker Hub](https://hub.docker.com/) for publishing your container
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed
- accessible Kubernetes Cluster (Minikube or hosted cluster like GKE)
- `gettext` and `envsubst` for *nix OS

### ToDo

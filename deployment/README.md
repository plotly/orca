Deployment to GKE using Docker and Kubernetes is a work in progress.

Build & push:
```
docker build -f deployment/Dockerfile -t gcr.io/jody-imageserver-test/imageserver:v4 .
gcloud docker -- push gcr.io/jody-imageserver-test/imageserver:v4
```

Provision & deploy:
```
gcloud beta container clusters create imageserver --enable-autoscaling --min-nodes=1 --max-nodes=3 --num-nodes=1 --zone=us-central1-a --additional-zones=us-central1-b,us-central1-c --enable-autoupgrade --cluster-version=1.7.6-gke.1
# Note: "min", "num", and "max" nodes sets the number PER ZONE.
kubectl apply -f deployment
kubectl get service imageserver # Will show the load balancer IP when it's ready
```

Rolling update (and rollback if needed):
```
kubectl set image deployments/imageserver imageserver-app=gcr.io/jody-imageserver-test/imageserver:v4
kubectl rollout undo deployments/imageserver
```

Cleanup
```
gcloud container clusters delete imageserver
```

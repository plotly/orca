# Deployment to GKE using Docker and Kubernetes

## Provision:

This is done once, manually. Replace `ENVIRONMENT` with the environment you're
working with (currently `stage` and `prod` are supported).

The scaling limit variables `--min-nodes`, `--max-nodes`, and `--num-nodes`
must be set to the appropriate count *per zone*.

`--cluster-version` may need to be updated to reflect newer versions of GKE.
If you need to do this, visit the GCP web console, Kubernetes Engine section,
start to create a new cluster, and check the default version under "Cluster
Version".

```
gcloud beta container clusters create imageserver-ENVIRONMENT --enable-autoscaling --min-nodes=1 --max-nodes=3 --num-nodes=1 --zone=us-central1-a --additional-zones=us-central1-b,us-central1-c --enable-autoupgrade --cluster-version=1.7.8-gke.0

kubectl apply -f deployment/kube/ENVIRONMENT
kubectl get service imageserver # Will show the load balancer IP when it's ready
```

## Build & push:

Builds are performed automatically by CircleCI, and if all tests pass the image
will be pushed to GCR. Images are tagged using the branch name and the
sha1 of the git commit.

## Deploy, plotly.js upgrade, rollback

This is done using plotbot. The following commands provide help:

```
@plotbot deploy how
@plotbot run how
```

# Font Support

The image server ships with many built-in fonts (see the Dockerfile for a list)
and also supports external fonts. External fonts are intended for restrictively
licensed fonts that we can not ship as part of the open source release, and
may also be used by 3rd party users to install their own fonts (restrictively
licensed or open source).

On boot, the image server looks for fonts in `/usr/share/fonts/user` and will
use any valid font found there. You may map a directory into this location in
the container.

In GKE, the pod requires a GCE Persistent Disk called
`plotly-cloud-licensed-fonts` that contains the restrictively licensed fonts
used by Plotly Cloud. To update fonts:

1. In the `PlotlyCloud` project, create a disk from the
`plotly-cloud-licensed-fonts` image and attach it to a GCE VM.

2. Reboot the GCE VM, then mount /dev/sdb to a temporary directory.

3. Add/remove/update fonts in this temporary directory.

4. Unmount the temporary directory and detach the disk from the VM.

5. Delete the `plotly-cloud-licensed-fonts` image and re-create it from the disk.

6. Create new `plotly-cloud-licensed-fonts` persistent disks from the image:

```
for zone in us-central1-a us-central1-b us-central1-c ; do
  gcloud compute disks create plotly-cloud-licensed-fonts --image-project=sunlit-shelter-132119 --image=plotly-cloud-licensed-fonts --zone $zone
done
```

# Mapbox Access Token

In order to use the Mapbox functionality built in to plotly.js, a Mapbox
access token must be provided. This can be part of the plot JSON, but for cases
where it is not included in the plot JSON it is useful to have a default.

To specify one, add it as a Kubernetes secret:

```
echo -n "pk.whatever.blabla" > /tmp/token
kubectl create secret generic mapbox --from-file=default_access_token=/tmp/token
```

After adding the secret for the first time or it changes, you'll need to recreate
all pods. The easiest way to do this is by running the update_plotlyjs command.

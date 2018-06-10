#!/bin/sh
##
# Script to remove/undeploy all project resources from the local Minikube environment.
##

# Delete express deployment and service
kubectl delete deployment express-deployment
kubectl delete service express-app

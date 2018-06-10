#!/bin/sh
##
# Script to remove/undeploy all project resources from the local Minikube environment.
##

# Delete react deployment and service
kubectl delete deployment react-deployment
kubectl delete service react-app
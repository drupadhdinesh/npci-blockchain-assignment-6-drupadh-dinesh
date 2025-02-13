#!/bin/bash

set -eou pipefail

# All checks run in the workshop root folder
cd "$(dirname "$0")"/..

. checks/utils.sh

EXIT=0

function operator_crds() {
  kubectl get customresourcedefinition.apiextensions.k8s.io/ibpcas.ibp.com
  kubectl get customresourcedefinition.apiextensions.k8s.io/ibpconsoles.ibp.com
  kubectl get customresourcedefinition.apiextensions.k8s.io/ibporderers.ibp.com
  kubectl get customresourcedefinition.apiextensions.k8s.io/ibppeers.ibp.com
}

function fabric_resources() {
  # Did it apply the CRDs?
  kubectl -n ${WORKSHOP_NAMESPACE} get ibpca org0-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get ibpca Airtel-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get ibpca Jio-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get ibppeer Airtel-peer1
  kubectl -n ${WORKSHOP_NAMESPACE} get ibppeer Airtel-peer2
  kubectl -n ${WORKSHOP_NAMESPACE} get ibppeer Jio-peer1
  kubectl -n ${WORKSHOP_NAMESPACE} get ibppeer Jio-peer2
  kubectl -n ${WORKSHOP_NAMESPACE} get ibporderer org0-orderersnode1
  kubectl -n ${WORKSHOP_NAMESPACE} get ibporderer org0-orderersnode2
  kubectl -n ${WORKSHOP_NAMESPACE} get ibporderer org0-orderersnode3
}

function fabric_deployment() {
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment fabric-operator
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment org0-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment org0-orderersnode1
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment org0-orderersnode2
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment org0-orderersnode3
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Airtel-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Airtel-peer1
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Airtel-peer2
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Jio-ca
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Jio-peer1
  kubectl -n ${WORKSHOP_NAMESPACE} get deployment Jio-peer2
}

function cas_ready() {
  WORKSHOP_CRYPTO=$WORKSHOP_PATH/infrastructure/sample-network/temp

  # Hit the CAs using the TLS certs, etc.
  curl --fail -s --cacert $WORKSHOP_CRYPTO/cas/org0-ca/tls-cert.pem https://$WORKSHOP_NAMESPACE-org0-ca-ca.$WORKSHOP_INGRESS_DOMAIN/cainfo | jq -c
  curl --fail -s --cacert $WORKSHOP_CRYPTO/cas/Airtel-ca/tls-cert.pem https://$WORKSHOP_NAMESPACE-Airtel-ca-ca.$WORKSHOP_INGRESS_DOMAIN/cainfo | jq -c
  curl --fail -s --cacert $WORKSHOP_CRYPTO/cas/Jio-ca/tls-cert.pem https://$WORKSHOP_NAMESPACE-Jio-ca-ca.$WORKSHOP_INGRESS_DOMAIN/cainfo | jq -c
}

function channel_msp() {
  WORKSHOP_CRYPTO=$WORKSHOP_PATH/infrastructure/sample-network/temp

  find $WORKSHOP_CRYPTO/channel-msp
}

must_declare WORKSHOP_PATH
must_declare FABRIC_CFG_PATH

check operator_crds     "fabric-operator CRDs have been installed"
check fabric_resources  "Network Peers, Orderers, and CAs have been created"
check fabric_deployment "Service deployments are ready"
check cas_ready         "Certificate Authorities are running"
check channel_msp       "Channel has been created"

exit $EXIT


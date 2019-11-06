export function getKubernetesTemplates(
    repo: any,
    name: string,
    containerPort: number,
    replicaNumber: number,
    minReplicas: number,
    maxReplicas: number,
    targetCPUUtilizationPercentage: number
) {
    return [
        {
            apiVersion: "v1",
            kind: "Service",
            metadata: { name },
            spec: {
                type: "LoadBalancer",
                ports: [{ port: 80, targetPort: containerPort }],
                selector: { app: name }
            }
        },
        {
            apiVersion: "apps/v1",
            kind: "Deployment",
            metadata: { name },
            spec: {
                replicas: replicaNumber,
                selector: { matchLabels: { app: name } },
                template: {
                    metadata: {
                        labels: { app: name }
                    },
                    spec: {
                        containers: [
                            {
                                name: name,
                                image: repo.imageUri,
                                ports: [{ containerPort }]
                            }
                        ]
                    }
                }
            }
        },
        {
            apiVersion: "autoscaling/v1",
            kind: "HorizontalPodAutoscaler",
            metadata: { name },
            spec: {
                maxReplicas,
                minReplicas,
                targetCPUUtilizationPercentage,
                scaleTargetRef: {
                    apiVersion: "extensions/v1beta1",
                    kind: "Deployment",
                    name
                }
            }
        }
    ]
}